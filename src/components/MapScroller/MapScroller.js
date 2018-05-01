const React = require("react");
const ReactDOM = require("react-dom");
const Scrollyteller = require("@abcnews/scrollyteller");
const topojson = require("topojson");
const canvasDpiScaler = require("canvas-dpi-scaler");

// Load up some helper functions etc
const utils = require("../../lib/utils");

// D3 modules
const d3Selection = require("d3-selection");
require("d3-transition");
const d3Geo = require("d3-geo");
const d3GeoProjection = require("d3-geo-projection");
const d3Interpolate = require("d3-interpolate");
const d3Zoom = require("d3-zoom");
const d3Scale = require("d3-scale");
const d3Ease = require("d3-ease");
const d3Queue = require("d3-queue");

// Import styles
const styles = require("./MapScroller.scss");

const SIMPLIFICATION_LEVELS = 10;
const SIMPLIFICATION_FACTOR = 1.6; // Higher is more complex per level
const MAX_ZOOM = 2500;

const STATE_ZOOM_MARGINS = 0.23;
const LGA_ZOOM_MARGINS = 0.46;
const MAX_ZOOM_LEVEL = 110000;
const MIN_ZOOM_LEVEL = 3000;
const MAX_TRANSITION_TIME = 1300;
const MIN_TRANSITION_TIME = 700;

// File scope vars
let initialGlobeScale;
let dataZoom = 100;
let context;
let path;
let projection;
let canvas;

// Different levels of zoom pre-compilied
let australia = [];
let australiaOutline = [];
let ausStates = [];

// Try to prevent multiple transitions
let tweening = 1;

// Set defaults
let currentFocus = "72330"; // Middle of Australia (pretty much)
// let previousFocus = "72330";
let currentLongLat = [133.7751, -25.2744]; //getItem("australia").longlat;

// documentElement is for Firefox support apparently
let screenWidth =
  document.documentElement.clientWidth || document.body.clientWidth; // minus scroll bars
let screenHeight = window.innerHeight;
let margins = Math.min(screenWidth, screenHeight) * 0.1;

function getScaleDomain(min, max, stops) {
  // Produces a d3 linear scale domain evenly spaced
  const scaleDomain = [];
  const size = max / (stops - 1);

  let current = min;
  for (let i = 0; i < stops; i++) {
    scaleDomain.push(current);
    current = current + size;
  }
  return scaleDomain;
}

// Set up a queue
var q = d3Queue.queue(1);

// Linear scale
const colorScale = d3Scale
  .scaleLinear()
  .domain(getScaleDomain(0, 35, 13))
  .range([
    "#E1E6DA",
    "#BFE3CD",
    "#9CD9CE",
    "#7ACFD4",
    "#5EC0CD",
    "#3FB2C6",
    "#24A3BC",
    "#188CAD",
    "#0F75A0",
    "#085B96",
    "#03418D",
    "#002875",
    "#00114B"
  ]);

// Bucket scale - decided not to use
// const colorScale = d3Scale
//   .scaleQuantize()
//   .domain([0, 35])
//   .range([
//     "#E9F1DE",
//     "#B7E9D2",
//     "#8CDED3",
//     "#60D0D3",
//     "#32C2CB",
//     "#00B4C3",
//     "#00A5B8",
//     "#008FA9",
//     "#00799B",
//     "#006091",
//     "#004987",
//     "#00326F",
//     "#001947"
//   ]);

const zoomScale = d3Scale
  .scaleLinear()
  .domain([1, 16])
  .range([1, 2000]);

class MapScroller extends React.Component {
  constructor(props) {
    super(props);

    this.state = { highlight: true, hasFocused: false };
    this.canvasInit = this.canvasInit.bind(this);
    this.markTrigger = this.markTrigger.bind(this);
    this.doMarker = this.doMarker.bind(this);
  }

  componentDidMount() {
    // Wait until mounted and then initialise the canvas
    this.canvasInit(this.props.mapData, this.props.ausStatesGeo);
  }

  canvasInit(mapData, ausStatesGeo) {
    // Check to see if position.sticky is supported
    // and then apply sticky styles
    stickifyStage();

    // Set up pre-compiled simplification levels
    let baseSimplification = 0.01;

    const getGeo = (mapData, level) => {
      const preSimplifiedMapData = topojson.presimplify(mapData);

      const simplifiedMapData = topojson.simplify(preSimplifiedMapData, level);

      const geoJSON = topojson.feature(
        simplifiedMapData,
        mapData.objects.LGA_2016_AUST
      );

      // Merge LGAs to get map of Australia
      const ausOutline = topojson.merge(
        simplifiedMapData,
        mapData.objects.LGA_2016_AUST.geometries
      );

      const lgaTopData = this.props.lgaData; //require("../App/lga-data.json");

      // Loop through all LGAs and set top percentage
      geoJSON.features.forEach(element => {
        lgaTopData.some(lga => {
          if (Number(element.properties.LGA_CODE16) === +lga.LGA_CODE_2016) {
            element.properties.TOP = +lga.TOP;
          }
          // Break the "some" loop by returning true
          return Number(element.properties.LGA_CODE16) === +lga.LGA_CODE_2016;
        });
      });

      const geoDataReturn = {
        lgas: geoJSON,
        outline: ausOutline
      };

      return geoDataReturn;
    };

    // Create an array of Australian LGAs with different simplification levels
    for (let i = 0; i < SIMPLIFICATION_LEVELS; i++) {
      australia[i] = getGeo(mapData, baseSimplification).lgas;
      australiaOutline[i] = getGeo(mapData, baseSimplification).outline;
      baseSimplification = baseSimplification / SIMPLIFICATION_FACTOR;
    }

    // Set up the global geoometry for Australian States
    ausStates = ausStatesGeo.features;

    // Set up a D3 projection here
    projection = d3Geo
      .geoOrthographic() // Global
      .rotate(invertLongLat(currentLongLat)) // Rotate to Australia
      .precision(0)
      .fitExtent(
        // Auto zoom
        [
          [margins /* - screenWidth * 0.06 */, margins],
          [screenWidth - margins, screenHeight - margins]
        ],
        australia[0]
      );

    // Set initial global scale to handle zoom ins and outs
    initialGlobeScale = projection.scale();

    canvas = d3Selection
      .select("." + styles.stage)
      .style("background-color", "#f9f9f9")
      .attr("width", screenWidth)
      .attr("height", screenHeight);

    // Set up our canvas drawing context aka pen
    context = canvas.node().getContext("2d");

    // A non-d3 element selection for Retina dn High DPI scaling
    const canvasEl = document.querySelector("." + styles.stage);

    // Auto-convert canvas to Retina display and High DPI monitor scaling
    canvasDpiScaler(canvasEl, context);

    // Build a path generator for our orthographic projection
    path = d3Geo
      .geoPath()
      .projection(projection)
      .context(context);

    // Draw the inital state of the world
    this.drawWorld(australia[0], australiaOutline[0]);
  }

  markTrigger(markerData) {
    let stateCode;
    // TODO: implement this if necessary
    // if (markerData.lga.value > 9) {
    //   stateCode = Math.floor(markerData.lga / 10000);
    // } else stateCode = markerData.lga;

    // this.props.doMarkerEvent(stateCode);

    q.defer(this.doMarker, markerData);
  }

  doMarker(markerData, callback) {
    currentFocus = markerData.lga + ""; // Turn into string

    //

    // Should we highlight current focus?
    if (markerData.highlight !== false) this.setState({ highlight: true });
    else this.setState({ highlight: false });

    // Should we highlight current Australian State
    // if (markerData.state === true) this.setState({ focusState: true });
    // else this.setState({ focusState: false });

    //Make sure we are mounted
    if (projection) {
      // Handle bottom brackets dark background
      if (!markerData.background) canvas.style("background-color", "#f9f9f9");

      let currentLgaGeometry = getLGA(currentFocus).geometry;

      let previousRotation = projection.rotate();
      let currentRotation = d3Geo.geoCentroid(currentLgaGeometry);

      // Zoom to states
      // TODO: fit projection to bounding box depending on STATE number
      const ausStatesGeo = this.props.ausStatesGeo.features[0];

      dataZoom = markerData.zoom;
      let previousGlobeScale = projection.scale();

      // Zoom in so that percentage set in marker relative to initial 100%
      let newGlobeScale = initialGlobeScale * (dataZoom / 100);

      if (!dataZoom || dataZoom === 0) {
        if (markerData.lga <= 8) {
          calculateLgaZoom(STATE_ZOOM_MARGINS);
        } else {
          calculateLgaZoom(LGA_ZOOM_MARGINS);
        }
      }

      function calculateLgaZoom(marginFactor) {
        // Calculate zoom to bounding box
        let marginMultiplier = marginFactor; // Margin % of screen

        // Save current projection state for later
        const tempScale = projection.scale();
        const tempTranslate = projection.translate();

        projection.fitExtent(
          [
            [
              Math.min(screenWidth, screenHeight) * marginMultiplier,
              Math.min(screenWidth, screenHeight) * marginMultiplier
            ],
            [
              screenWidth -
                Math.min(screenWidth, screenHeight) * marginMultiplier,
              screenHeight -
                Math.min(screenWidth, screenHeight) * marginMultiplier
            ]
          ],
          currentLgaGeometry
        );

        const boundingZoom = projection.scale();

        // Reset the projection
        projection.scale(tempScale);
        projection.translate(tempTranslate);

        newGlobeScale = boundingZoom;

        // Set limits on zoom
        if (markerData.lga <= 8) {
          if (newGlobeScale < initialGlobeScale)
            newGlobeScale = initialGlobeScale;
        } else {
          if (newGlobeScale < MIN_ZOOM_LEVEL) newGlobeScale = MIN_ZOOM_LEVEL;
        }
        // Control max zooms compress extent of levels
        if (newGlobeScale > MAX_ZOOM_LEVEL) newGlobeScale = MAX_ZOOM_LEVEL;
      }

      const dummyTransition = {};

      // This calculates the duration of the transitions based on location and zoom
      let timeZoomInterpolate = d3Interpolate.interpolateZoom(
        [previousRotation[0], previousRotation[1], previousGlobeScale * 0.005],
        [-currentRotation[0], -currentRotation[1], newGlobeScale * 0.005]
      );

      // let bounceZoomInterpolate = d3Interpolate.interpolateZoom(
      //   [previousRotation[0], previousRotation[1], 10],
      //   [-currentRotation[0], -currentRotation[1], 10]
      // );

      let rotationInterpolate = d3Interpolate.interpolate(previousRotation, [
        -currentRotation[0],
        -currentRotation[1],
        0
      ]);

      let scaleInterpolate = d3Interpolate.interpolate(
        projection.scale(),
        newGlobeScale
      );

      let rotationDelay = 0;
      let zoomDelay = 0;

      let maxTransitionTime = MAX_TRANSITION_TIME;
      let minTransitionTime = MIN_TRANSITION_TIME;
      let transitionTime;

      transitionTime = Math.abs(timeZoomInterpolate.duration);

      // Don't take too long
      if (transitionTime > maxTransitionTime)
        transitionTime = maxTransitionTime;
      // Don't go too fast
      if (transitionTime < minTransitionTime)
        transitionTime = minTransitionTime;

      let transitionDelayMultiplyer = 0.5;
      let isZoomingIn = true;

      // Determine if zooming in or out
      if (newGlobeScale > previousGlobeScale) {
        rotationDelay = 0;
        zoomDelay = transitionTime * transitionDelayMultiplyer;
        isZoomingIn = true;
      } else {
        rotationDelay = transitionTime * transitionDelayMultiplyer;
        zoomDelay = 0;
        isZoomingIn = false;
      }

      const rotationTween = d3Selection
        .select(dummyTransition)
        .transition("rotation")
        .delay(rotationDelay)
        .duration(transitionTime);

      // Playing with easing. Apply different easing if zooming in or out
      // (We are currently not bothering for now)
      if (isZoomingIn) rotationTween.ease(d3Ease.easeExp);
      else rotationTween.ease(d3Ease.easeExp);

      const zoomTween = d3Selection
        .select(dummyTransition)
        .transition("zoom")
        .delay(zoomDelay)
        .duration(transitionTime);

      let zoomOutDuration = 700;

      const zoomOutTween = d3Selection
        .select(dummyTransition)
        .transition("zoomout")
        .delay(0)
        .duration(zoomOutDuration);

      if (isZoomingIn) zoomTween.ease(d3Ease.easeExp);
      else zoomTween.ease(d3Ease.easeExp);

      rotationTween.tween("rotation", () => {
        // Return the tween function
        return time => {
          projection.rotate(rotationInterpolate(time));
        };
      });

      zoomTween.tween("zoom", () => {
        return time => {
          projection.scale(scaleInterpolate(time));
        };
      });

      // Separate render tween to handle different delays
      d3Selection
        .select(dummyTransition)
        .transition("render")
        .delay(0)
        .duration(transitionTime + Math.max(zoomDelay, rotationDelay)) // transition + delay
        // .ease(d3Ease.easeLinear)
        .tween("render", () => {
          // Return the tween function
          return time => {
            // If tweening > 1 then it means it's tweening;
            tweening = time;
            // Calculate current zoom and set up simplification scale
            let currentZoom = projection.scale() / initialGlobeScale * 100;

            const simplificationScale = d3Scale
              .scaleQuantize()
              .domain([100, MAX_ZOOM])
              .range(Array.from(Array(SIMPLIFICATION_LEVELS).keys()));

            // Draw a version of map based on zoom level
            this.drawWorld(
              australia[simplificationScale(currentZoom)],
              australiaOutline[simplificationScale(currentZoom)],
              markerData,
              tweening
            );

            if (tweening === 1)
              this.setState({ previousMarkerData: markerData });
          };
        });

      setTimeout(function() {
        canvas.style("transition", "background-color 0.3s");
        // Transition background after spin/zoom
        if (markerData.background && markerData.background === "dark")
          canvas.style("background-color", "#333");
        // else canvas.style("background-color", "#f9f9f9");

        // Call back d3-queue to let it know the transition is finished
        callback(null);
      }, transitionTime + Math.max(zoomDelay, rotationDelay));

      // Determine if camera should zoom out first
      // if (markerData.zoomout) {
      //   zoomOutTween.tween("zoomout", () => {
      //     let scaleOutInterpolate = d3Interpolate.interpolate(
      //       projection.scale(),
      //       initialGlobeScale
      //     );
      //     return time => {
      //       projection.scale(scaleOutInterpolate(time));
      //     };
      //   });

      //    rotationInterpolate = d3Interpolate.interpolate(previousRotation, [
      //     -currentRotation[0],
      //     -currentRotation[1],
      //     0
      //   ]);

      //    scaleInterpolate = d3Interpolate.interpolate(
      //     initialGlobeScale,
      //     newGlobeScale
      //   );

      //   if (newGlobeScale > previousGlobeScale) {
      //     rotationDelay = 0;
      //     zoomDelay = transitionTime * transitionDelayMultiplyer;
      //     isZoomingIn = true;
      //   } else {
      //     rotationDelay = transitionTime * transitionDelayMultiplyer;
      //     zoomDelay = 0;
      //     isZoomingIn = false;
      //   }

      //   rotationTween.delay(zoomOutDuration + rotationDelay);
      //   zoomTween.delay(zoomOutDuration + zoomDelay);

      //   rotationTween.tween("rotation", () => {
      //     // Return the tween function
      //     return time => {
      //       projection.rotate(rotationInterpolate(time));
      //     };
      //   });

      //   zoomTween.tween("zoom", () => {
      //     return time => {
      //       projection.scale(scaleInterpolate(time));
      //     };
      //   });

      //   // Separate render tween to handle different delays
      //   d3Selection
      //     .select(dummyTransition)
      //     .transition("render")
      //     .delay(0)
      //     .duration(transitionTime + Math.max(zoomDelay, rotationDelay) + zoomOutDuration) // transition + delay
      //     // .ease(d3Ease.easeLinear)
      //     .tween("render", () => {
      //       // Return the tween function
      //       return time => {
      //         // If tweening > 1 then it means it's tweening;
      //         tweening = time;
      //         // Calculate current zoom and set up simplification scale
      //         let currentZoom = projection.scale() / initialGlobeScale * 100;

      //         const simplificationScale = d3Scale
      //           .scaleQuantize()
      //           .domain([100, MAX_ZOOM])
      //           .range(Array.from(Array(SIMPLIFICATION_LEVELS).keys()));

      //         // Draw a version of map based on zoom level
      //         this.drawWorld(
      //           australia[simplificationScale(currentZoom)],
      //           markerData,
      //           tweening
      //         );

      //         if (tweening === 1)
      //           this.setState({ previousMarkerData: markerData });
      //       };
      //     });

      //   setTimeout(function() {
      //     canvas.style("transition", "background-color 0.3s");
      //     // Transition background after spin/zoom
      //     if (markerData.background && markerData.background === "dark")
      //       canvas.style("background-color", "#333");
      //     // else canvas.style("background-color", "#f9f9f9");

      //     // Call back d3-queue to let it know the transition is finished
      //     callback(null);
      //   }, transitionTime +
      //     Math.max(zoomDelay, rotationDelay) +
      //     zoomOutDuration);
      // } else {

      // }

      // console.log("Previous: ");
      // console.log(this.state.previousMarkerData);
      // console.log(" ");
      // console.log("Current: ");
      // console.log(markerData);

      /*
       * The following will be helpful if we want to zoom out first
       * and then zoom back in again. In case we are traveling 
       * looooooong distances with limited zoom.
       */

      // d3Selection
      //   .select(dummyTransition)
      //   .transition("zoom")
      //   .delay(0)
      //   .duration(transitionTime / 2 + 500) //Math.abs(zoomInterpolate.duration))
      //   .tween("zoom", () => {
      //     // Return the tween function
      //     return time => {
      //       let scaleInterpolate = d3Interpolate.interpolate(
      //         previousGlobeScale,
      //         initialGlobeScale
      //       );

      //       projection.scale(scaleInterpolate(time));
      //     };
      //   })
      //   // Second half of transition
      //   .transition()
      //   .tween("zoom", () => {
      //     // Return the tween function
      //     return time => {
      //       let scaleInterpolate = d3Interpolate.interpolate(
      //         projection.scale(),
      //         newGlobeScale
      //       );

      //       projection.scale(scaleInterpolate(time));
      //       if (tweening === 1) {
      //         // Calculate current zoom and set up simplification scale
      //         let currentZoom = projection.scale() / initialGlobeScale * 100;

      //         const simplificationScale = d3Scale
      //           .scaleQuantize()
      //           .domain([100, MAX_ZOOM])
      //           .range(Array.from(Array(SIMPLIFICATION_LEVELS).keys()));

      //         // Draw a version of map based on zoom level
      //         this.drawWorld(australia[simplificationScale(currentZoom)]);
      //       }
      //     };
      //   });
    } else callback(null); // Always call back or else it hangs forever
  }

  drawWorld(australiaGeoJson, australiaOutline, markerData, tweening) {
    // Clear the canvas ready for redraw
    context.clearRect(0, 0, screenWidth, screenHeight);

    australiaGeoJson.features.forEach(element => {
      // Get bounds of current LGA
      const bounds = path.bounds(element);

      // console.log(element);

      // Don't render LGA if not on screen
      if (bounds[0][0] > screenWidth) return;
      if (bounds[0][1] > screenHeight) return;
      if (bounds[1][0] < 0) return;
      if (bounds[1][1] < 0) return;

      let fadeOutOpacity = 1 - tweening;
      let fadeInOpacity = tweening;

      // Highlight Australian state if specified in Scrollyteller
      // Fade out all the rest
      // TODO: if already faded out don't draw invisible LGA
      if (
        markerData &&
        markerData.state &&
        element.properties.STE_CODE16 !== this.props.currentAusState + ""
      ) {
        context.globalAlpha = fadeOutOpacity;
      } else if (
        this.state.previousMarkerData &&
        this.state.previousMarkerData.state &&
        element.properties.STE_CODE16 !== this.props.currentAusState + ""
      ) {
        context.globalAlpha = fadeInOpacity;
      } else if (
        // Handle if two HIGHLIGHT marks are in a row
        markerData &&
        markerData.focus &&
        this.state.previousMarkerData &&
        this.state.previousMarkerData.focus
      ) {
        let elementLgaCode = +element.properties.LGA_CODE16;

        if (
          this.state.previousMarkerData.focus.indexOf(elementLgaCode) > -1 &&
          markerData.focus.indexOf(elementLgaCode) > -1
        ) {
          context.globalAlpha = 1;
        } else if (
          this.state.previousMarkerData.focus.indexOf(elementLgaCode) > -1
        ) {
          context.globalAlpha = fadeOutOpacity;
        } else if (markerData.focus.indexOf(elementLgaCode) > -1) {
          context.globalAlpha = fadeInOpacity;
        } else if (markerData.focus.indexOf(elementLgaCode) < 0) {
          context.globalAlpha = 0;
        }
      } else if (markerData && markerData.focus) {
        let elementLgaCode = +element.properties.LGA_CODE16;

        if (markerData.focus.indexOf(elementLgaCode) > -1) {
          context.globalAlpha = 1;
        } else {
          context.globalAlpha = fadeOutOpacity;
        }
      } else if (
        this.state.previousMarkerData &&
        this.state.previousMarkerData.focus
      ) {
        let elementLgaCode = +element.properties.LGA_CODE16;
        if (this.state.previousMarkerData.focus.indexOf(elementLgaCode) > -1) {
          context.globalAlpha = 1;
        } else {
          context.globalAlpha = fadeInOpacity;
        }
      } else {
        // else if (markerData && markerData.focus && markerData.focus[0] !== +element.properties.LGA_CODE16 || markerData.focus[1] !== +element.properties.LGA_CODE16) {
        //   // console.log(markerData.focus[1] )
        //   // Fade out those not marked focus
        //   // TODO: Yes this THE WORST way of doing it but a loop wasn't working for some reason...
        //   context.globalAlpha = fadeOutOpacity;
        // }
        // else if (markerData && markerData.focus && markerData.focus[1]  !== +element.properties.LGA_CODE16) {
        //   context.globalAlpha = fadeOutOpacity;
        // }
        context.globalAlpha = 1;
      }

      // FOCUS LGAs and fade out the rest

      // for (let i = 0; i < markerData.focus.length; i++) {

      //  if (markerData.focus[i] === +element.properties.LGA_CODE16) {
      //   console.log (+element.properties.LGA_CODE16)
      //  } else {
      //    context.globalAlpha = 0.5;
      //  }
      // if (element.properties.LGA_CODE16 === markerData.focus[i] + "") {
      //   context.globalAlpha = fadeOutOpacity;
      // } else {
      //   context.globalAlpha = 1;
      // }
      // }

      // markerData.focus.forEach((focus) => {

      //   // console.log(focus + "")
      //   // console.log(element.properties.LGA_CODE16)
      //   if (focus + "" !== element.properties.LGA_CODE16) {
      //     context.globalAlpha = fadeOutOpacity;
      //   } else {
      //     context.globalAlpha = 1;
      //   }
      // }

      // Render current LGA a different colour/style
      if (
        markerData &&
        this.state.highlight &&
        element.properties.LGA_CODE16 === markerData.lga + ""
      ) {
        context.beginPath();
        context.fillStyle = "#FF5733";
        context.strokeStyle = "rgba(255, 255, 255, 0.4)";
        path(element);
        context.fill();
        context.stroke();
        return;
      }

      context.beginPath();
      context.fillStyle = colorScale(element.properties.TOP);
      context.strokeStyle = "rgba(255, 255, 255, 0.4)";
      context.lineWidth = 1.1;
      path(element);
      context.fill();
      context.stroke();
    });
    context.beginPath();
    context.globalAlpha = 1;
    // context.fillStyle = "#FF5733";
    context.strokeStyle = "rgba(100, 100, 100, 0.6)";
    context.lineWidth = 1.1;
    path(australiaOutline);
    // context.fill();
    context.stroke();
  }

  componentWillUpdate() {}

  render() {
    // Create props vars passed to this component
    const { scrollyteller } = this.props;

    return ReactDOM.createPortal(
      <div className={styles.wrapper}>
        <Scrollyteller
          panels={scrollyteller.panels}
          className={`scrolly Block is-richtext is-piecemeal ${
            styles.scrollyteller
          }`}
          panelClassName="Block-content u-layout u-richtext"
          onMarker={this.markTrigger}
        >
          <canvas className={styles.stage} />
          <div className={styles.legend}>
            <div className={styles.legendInner}>
              <div>
                Proportion of people in the top<br />
                income bracket
              </div>
              <div className={styles.leftRight}>
                <img src="data:image/svg+xml,%3C%3Fxml version='1.0' encoding='UTF-8'%3F%3E%3Csvg width='12px' height='9px' viewBox='0 0 12 9' version='1.1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink'%3E%3C!-- Generator: Sketch 49.3 %2851167%29 - http://www.bohemiancoding.com/sketch --%3E%3Ctitle%3EUntitled%3C/title%3E%3Cdesc%3ECreated with Sketch.%3C/desc%3E%3Cdefs%3E%3C/defs%3E%3Cg id='Page-1' stroke='none' stroke-width='1' fill='none' fill-rule='evenodd'%3E%3Cg id='arrow-left' fill='%23000000' fill-rule='nonzero'%3E%3Cpolygon id='arrow-left-copy' points='4.26153964 8.66666667 4.98778912 7.92670828 1.96710226 4.84900202 11.9882418 4.84806368 12 3.79274075 1.93289915 3.79444166 4.95080298 0.719570949 4.24456323 0 0 4.32468491'%3E%3C/polygon%3E%3C/g%3E%3C/g%3E%3C/svg%3E" />{" "}
                Lowest{" "}
                <span>
                  Highest{" "}
                  <img src="data:image/svg+xml,%3C%3Fxml version='1.0' encoding='UTF-8'%3F%3E%3Csvg width='12px' height='9px' viewBox='0 0 12 9' version='1.1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink'%3E%3C!-- Generator: Sketch 49.3 %2851167%29 - http://www.bohemiancoding.com/sketch --%3E%3Ctitle%3EUntitled%3C/title%3E%3Cdesc%3ECreated with Sketch.%3C/desc%3E%3Cdefs%3E%3C/defs%3E%3Cg id='Page-1' stroke='none' stroke-width='1' fill='none' fill-rule='evenodd'%3E%3Cg id='arrow-right' fill='%23000000' fill-rule='nonzero'%3E%3Cpolygon id='arrow-left-copy' transform='translate%286.000000, 4.333333%29 scale%28-1, 1%29 translate%28-6.000000, -4.333333%29 ' points='4.2615396 8.66666667 4.9877891 7.92670828 1.9671023 4.84900202 11.9882418 4.84806368 12 3.79274075 1.9328991 3.79444166 4.950803 0.719570949 4.2445632 0 0 4.32468491'%3E%3C/polygon%3E%3C/g%3E%3C/g%3E%3C/svg%3E" />
                </span>
              </div>

              <div className={styles.legendBar} />
            </div>
          </div>
        </Scrollyteller>
      </div>,
      scrollyteller.mountNode
    );
  }
} // End of MapScroller component

function stickifyStage() {
  // Detect whether position: sticky is supported (and not IE or Edge browser) and apply styles
  if (Modernizr.csspositionsticky && utils.detectIE() === false) {
    document.body.style.overflowX = "visible";
    document.body.style.overflowY = "visible";

    let scrollyEl = document.querySelector(".scrolly");

    utils.addClass(scrollyEl, "yes-csspositionsticky");
  }
}

// Helper for indexing an array of objects
function getLGA(lgaCode) {
  // 1=NSW 2=VIC 3=QLD 4=SA 5=WA 6=TAS 7=NT 8=ACT
  if (Number(lgaCode) <= 8) return ausStates[Number(lgaCode) - 1];

  // Otherwise return LGA geography as per normal
  return australia[australia.length - 1].features.find(
    lga => lga.properties.LGA_CODE16 === lgaCode
  );
}

function invertLongLat(longlat) {
  return [-longlat[0], -longlat[1]];
}

// Calculate the area of a polygon
function polygonArea(points) {
  var sum = 0.0;
  var length = points.length;
  if (length < 3) {
    return sum;
  }
  points.forEach(function(d1, i1) {
    i2 = (i1 + 1) % length;
    d2 = points[i2];
    sum += d2[1] * d1[0] - d1[1] * d2[0];
  });
  return sum / 2;
}

// Polyfill for .find()
// https://tc39.github.io/ecma262/#sec-array.prototype.find
if (!Array.prototype.find) {
  Object.defineProperty(Array.prototype, "find", {
    value: function(predicate) {
      // 1. Let O be ? ToObject(this value).
      if (this == null) {
        throw new TypeError('"this" is null or not defined');
      }

      var o = Object(this);

      // 2. Let len be ? ToLength(? Get(O, "length")).
      var len = o.length >>> 0;

      // 3. If IsCallable(predicate) is false, throw a TypeError exception.
      if (typeof predicate !== "function") {
        throw new TypeError("predicate must be a function");
      }

      // 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
      var thisArg = arguments[1];

      // 5. Let k be 0.
      var k = 0;

      // 6. Repeat, while k < len
      while (k < len) {
        // a. Let Pk be ! ToString(k).
        // b. Let kValue be ? Get(O, Pk).
        // c. Let testResult be ToBoolean(? Call(predicate, T, « kValue, k, O »)).
        // d. If testResult is true, return kValue.
        var kValue = o[k];
        if (predicate.call(thisArg, kValue, k, o)) {
          return kValue;
        }
        // e. Increase k by 1.
        k++;
      }

      // 7. Return undefined.
      return undefined;
    }
  });
}

module.exports = MapScroller;
