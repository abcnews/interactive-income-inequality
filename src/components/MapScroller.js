const React = require("react");
const ReactDOM = require("react-dom");
const Scrollyteller = require("@abcnews/scrollyteller"); //require("@abcnews/scrollyteller");
const topojson = require("topojson");
const canvasDpiScaler = require("canvas-dpi-scaler");

// Load up some helper functions etc
const utils = require("../lib/utils");

// D3 modules
const d3Selection = require("d3-selection");
require("d3-transition");
const d3Geo = require("d3-geo");
const d3GeoProjection = require("d3-geo-projection");
const d3Interpolate = require("d3-interpolate");

// Import styles
const styles = require("./MapScroller.scss");

// Import story data
const storyData = require("./storyData.json");

// File scope vars - not really needed but yeah good to track
let initialGlobeScale;
let australiaGeoLga;
let context;
let path;
let projection;

// Set defaults
let currentFocus = "australia";
let previousFocus = "australia";
let currentLongLat = getItem("australia").longlat;

// documentElement is for Firefox support apparently
let screenWidth =
  document.documentElement.clientWidth || document.body.clientWidth; // minus scroll bars
let screenHeight = window.innerHeight;
let margins = screenWidth * 0.10;

class MapScroller extends React.Component {
  constructor(props) {
    super(props);

    this.state = {};
  }
  componentDidMount() {
    this.canvasInit(this.props.mapData);
  }

  canvasInit(mapData) {
    australiaGeoLga = topojson.feature(mapData, mapData.objects.LGA_2016_AUST);
    const globe = { type: "Sphere" };

    // Set up a D3 projection here
    projection = d3Geo
      // .geoConicConformal()
      // .geoMercator()
      .geoOrthographic()
      // .geoEquirectangular()
      // .geoConicEqualArea()
      .rotate(invertLongLat(currentLongLat)) // Rotate to Australia
      // .translate([screenWidth / 2, screenHeight / 2])
      // .clipAngle(90) // Only display front side of the world
      .precision(0.5)
      .fitExtent(
        // Auto zoom
        [
          [margins - screenWidth * 0.06, margins],
          [screenWidth - margins, screenHeight - margins]
        ],
        australiaGeoLga
      );

    // Set initial global scale to handle zoom ins and outs
    initialGlobeScale = projection.scale();

    const canvas = d3Selection
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
    this.drawWorld();

    // Check to see if position.sticky is supported
    // and then apply sticky styles
    stickifyStage();

    // Function for clearing and render a frame of each part of the globe
  }

  doMarker(data) {
    previousFocus = currentFocus;
    currentFocus = data.focus;
    console.log(previousFocus);
    console.log(currentFocus);

    // Make sure we are mounted
    if (projection) {
      let previousRotation = projection.rotate();
      let currentRotation = getItem(currentFocus).longlat;

      currentLongLat = getItem(currentFocus).longlat;
      projection.rotate(invertLongLat(currentLongLat));

      const dummyTransition = {};

      d3Selection
        .select(dummyTransition)
        .transition("transition")
        .delay(0)
        .duration(1000)
        .tween("spinner", () => {
          let rotationInterpolate = d3Interpolate.interpolate(
            previousRotation,
            [-currentRotation[0], -currentRotation[1], 0]
          );

          // let scaleInterpolate = d3.interpolate(previousScale, currentScale);

          // Return the tween function
          return time => {
            projection.rotate(rotationInterpolate(time));
            // rangeCircle.radius(radiusInterpolate(time));
            // projection.scale(scaleInterpolate(time));
            this.drawWorld();
          };
        });
    }
  }

  drawWorld() {
    // Clear the canvas ready for redraw
    context.clearRect(0, 0, screenWidth, screenHeight);

    // Draw all landmasses
    context.beginPath();
    context.strokeStyle = "rgba(255, 255, 255, 0.9)";
    context.fillStyle = "#1A90AF";
    context.lineWidth = 1.1;
    path(australiaGeoLga);
    context.fill();
    context.stroke();
  }

  render() {
    // Create props vars passed to this component
    const { scrollyteller, mapData } = this.props;

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
  // Detect whether position: sticky is supported (and not Edge browser) and apply styles
  if (Modernizr.csspositionsticky && utils.detectIE() === false) {
    document.body.style.overflowX = "visible";
    document.body.style.overflowY = "visible";

    let scrollyEl = document.querySelector(".scrolly");

    utils.addClass(scrollyEl, "yes-csspositionsticky");
  }
}

// Heloper for indexing an array of objects
function getItem(id) {
  return storyData.locations.find(item => item.id === id);
}

function invertLongLat(longlat) {
  return [-longlat[0], -longlat[1]];
}

module.exports = MapScroller;
