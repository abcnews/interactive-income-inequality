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

// Import styles
const styles = require("./MapZoom.scss");

const d3 = require("d3");

// Import story data
// const storyData = require("./storyData.json");

const MAP_SIMPLIFICATION_LEVEL = 0.02;
const MAP_SIMPLIFICATION_MAX = 0.0;

// File scope vars - not really needed maybe but yeah good to track
let initialGlobeScale;
let globeScale = 100;
let australiaGeoLga;
let context;
let path;
let projection;
let canvas;
let radius = 2.5;

// Set defaults
let currentFocus = "72330"; // Middle of Australia (pretty much)
let previousFocus = "72330";
let currentLongLat = [133.7751, -25.2744]; //getItem("australia").longlat;

// documentElement is for Firefox support apparently
let screenWidth =
  document.documentElement.clientWidth || document.body.clientWidth; // minus scroll bars
let screenHeight = window.innerHeight;
let margins = screenWidth * 0.1;

var colorScale = d3Scale
  .scaleLinear()
  .domain([0, 27])
  .range(["#eee", "#00114B"]);

const zoomScale = d3Scale
  .scaleLinear()
  .domain([1, 16])
  .range([1, 2000]);

class MapScroller extends React.Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  componentDidMount() {
    this.canvasInit(this.props.mapData);
  }

  canvasInit(mapData) {
    // Check to see if position.sticky is supported
    // and then apply sticky styles
    stickifyStage();

    let preSimplifiedMapData = topojson.presimplify(mapData);

    simplifiedMapData = topojson.simplify(
      preSimplifiedMapData,
      MAP_SIMPLIFICATION_LEVEL
    );

    australiaGeoLga = topojson.feature(
      simplifiedMapData,
      mapData.objects.LGA_2016_AUST
    );

    const lgaTopData = require("./lga-top.json");

    // Loop through all LGAs and set top percentage
    australiaGeoLga.features.forEach(element => {
      lgaTopData.some(lga => {
        if (Number(element.properties.LGA_CODE16) === lga.LGA_CODE_2016) {
          element.properties.TOP = lga.TOP;
        }
        // Break the "some" loop by returning true

        return Number(element.properties.LGA_CODE16) === lga.LGA_CODE_2016;
      });
    });

    const globe = { type: "Sphere" };

    // Set up a D3 projection here
    projection = d3Geo
      // .geoConicConformal() // North top
      .geoOrthographic() // Global
      .rotate(invertLongLat(currentLongLat)) // Rotate to Australia
      .precision(0.5)
      .fitExtent(
        // Auto zoom
        [
          [margins /* - screenWidth * 0.06 */, margins],
          [screenWidth - margins, screenHeight - margins]
        ],
        australiaGeoLga
      );

    // Set initial global scale to handle zoom ins and outs
    initialGlobeScale = projection.scale();
    console.log(initialGlobeScale);

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

    const clip = d3Geo
      .geoIdentity()
      .clipExtent([[0, 0], [screenWidth, screenHeight]]);

    // const simplify = d3Geo.geoTransform({
    //   point: function(x, y, z) {
    //     if (z >= minZ) this.stream.point(x, y);
    //   }
    // });

    // Build a path generator for our orthographic projection
    path = d3Geo
      .geoPath()
      .projection({
        // Here we return a clipped stream of the projection
        stream: function(s) {
          return projection.stream(clip.stream(s));
        }
      })
      .context(context);

    var points = d3.range(1000).map(phyllotaxis(10)),
      point = points.pop();

    var zoom = d3.zoom().on("zoom", zoomed);

    canvas.call(zoom.transform, transform).call(transition);

    function zoomed() {
      context.save();
      context.clearRect(0, 0, screenWidth, screenHeight);
      context.translate(d3.event.transform.x, d3.event.transform.y);
      context.scale(d3.event.transform.k, d3.event.transform.k);
      drawPoints();
      context.restore();
    }

    function drawPoints() {
      context.beginPath();
      points.forEach(drawPoint);
      context.fillStyle = "#000";
      context.fill();

      context.beginPath();
      drawPoint(point);
      context.fillStyle = "#f00";
      context.fill();
      context.stroke();
    }

    function drawPoint(point) {
      context.moveTo(point[0] + radius, point[1]);
      context.arc(point[0], point[1], radius, 0, 2 * Math.PI);
    }

    function transform() {
      return d3.zoomIdentity
        .translate(screenWidth / 2, screenWidth / 2)
        .scale(8)
        .translate(-point[0], -point[1]);
    }

    function transition(canvas) {
      var n = points.length,
        i = (Math.random() * n) | 0,
        c = points[i]; // Pick a random point.

      points[i] = points[n - 1];
      points[n - 1] = point;
      point = c;

      canvas
        .transition()
        .delay(500)
        .duration(3000)
        .call(zoom.transform, transform)
        .on("end", function() {
          canvas.call(transition);
        });
    }

    function phyllotaxis(radius) {
      var theta = Math.PI * (3 - Math.sqrt(5));
      return function(i) {
        var r = radius * Math.sqrt(i),
          a = theta * i;
        return [
          screenWidth / 2 + r * Math.cos(a),
          screenWidth / 2 + r * Math.sin(a)
        ];
      };
    }

    // let translation = projection([153.0251, -27.4698]);

    // projection.translate([100, 100]);

    // this.setNewSimplification(this.props.mapData, MAP_SIMPLIFICATION_MAX);

    // Draw the inital state of the world
    this.drawWorld();

    // Function for clearing and render a frame of each part of the globe
  }

  setNewSimplification(mapData, zoomLevel) {
    let preSimplifiedMapData = topojson.presimplify(mapData);

    simplifiedMapData = topojson.simplify(preSimplifiedMapData, zoomLevel);

    australiaGeoLga = topojson.feature(
      simplifiedMapData,
      mapData.objects.LGA_2016_AUST
    );
  }

  doMarker(data) {
    previousFocus = currentFocus;
    currentFocus = data.lga + ""; // Turn into string

    // Make sure we are mounted
    // if (projection) {
    //   let previousRotation = projection.rotate();
    //   let currentRotation = d3Geo.geoCentroid(getLGA(currentFocus).geometry); //getItem(currentFocus).longlat;

    //   // currentLongLat = getItem(currentFocus).longlat;
    //   // projection.rotate(invertLongLat(currentLongLat));

    //   globeScale = data.zoom || 100;
    //   let previousGlobeScale = projection.scale();

    //   this.setNewSimplification(this.props.mapData, MAP_SIMPLIFICATION_LEVEL);

    //   // Zoom in so that percentage set in marker relative to initial 100%
    //   let newGlobeScale = initialGlobeScale * (globeScale / 100);

    //   const dummyTransition = {};

    //   d3Selection
    //     .select(dummyTransition)
    //     .transition("transition")
    //     .delay(0)
    //     .duration(1000)
    //     .tween("spinner", () => {
    //       let rotationInterpolate = d3Interpolate.interpolate(
    //         previousRotation,
    //         [-currentRotation[0], -currentRotation[1], 0]
    //       );

    //       let scaleInterpolate = d3Interpolate.interpolate(
    //         previousGlobeScale,
    //         newGlobeScale
    //       );

    //       // Return the tween function
    //       return time => {
    //         // console.log(1 / zoomScale(scaleInterpolate(time) / initialGlobeScale))
    //         // this.setNewSimplification(this.props.mapData, 1 / zoomScale(scaleInterpolate(time) / initialGlobeScale));
    //         projection.rotate(rotationInterpolate(time));
    //         projection.scale(scaleInterpolate(time));
    //         // if (time === 1) this.setNewSimplification(this.props.mapData, MAP_SIMPLIFICATION_MAX);
    //         this.drawWorld();
    //       };
    //     });
    // }
  }

  drawWorld() {
    // Clear the canvas ready for redraw
    context.clearRect(0, 0, screenWidth, screenHeight);

    // Draw all landmasses
    // context.beginPath();
    // context.strokeStyle = "rgba(255, 255, 255, 0.9)";
    // context.fillStyle = "#1A90AF";
    // context.lineWidth = 1.1;
    // path(australiaGeoLga);
    // context.fill();
    // context.stroke();

    // Loop through all LGAs and aplly colours
    australiaGeoLga.features.forEach(element => {
      // console.log(element);
      context.beginPath();
      context.fillStyle = colorScale(element.properties.TOP);
      context.strokeStyle = "rgba(255, 255, 255, 0.4)";
      path(element);
      context.fill();
      context.stroke();
    });

    // Draw white outline
    // context.beginPath();
    // context.strokeStyle = "rgba(255, 255, 255, 0.4)";
    // context.fillStyle = "#1A90AF";
    // context.lineWidth = 1.1;
    // path(australiaGeoLga);
    // // context.fill();
    // context.stroke();
  }

  componentWillUpdate() {}

  render() {
    // Create props vars passed to this component
    const { scrollyteller, mapData } = this.props;

    // scrollyteller.panels.pop();

    // panels[1].config.zoom = 500;
    // console.log(panels[6].nodes["0"].parentNode)
    // panels.pop();
    // panels[1].nodes[0].innerHTML = "Hello";

    return ReactDOM.createPortal(
      <div className={styles.wrapper}>
        <Scrollyteller
          panels={scrollyteller.panels}
          className={`scrolly Block is-richtext is-piecemeal ${
            styles.scrollyteller
          }`}
          panelClassName="Block-content u-layout u-richtext"
          onMarker={this.doMarker.bind(this)}
        >
          <canvas className={styles.stage} />
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

// Heloper for indexing an array of objects
function getLGA(lgaCode) {
  return australiaGeoLga.features.find(
    lga => lga.properties.LGA_CODE16 === lgaCode
  );
}

function invertLongLat(longlat) {
  return [-longlat[0], -longlat[1]];
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
