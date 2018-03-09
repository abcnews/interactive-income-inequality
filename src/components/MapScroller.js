const React = require("react");
const ReactDOM = require("react-dom");
const Scrollyteller = require("@abcnews/scrollyteller"); //require("@abcnews/scrollyteller");
const topojson = require("topojson");

const utils = require("../lib/utils")

// D3 modules
const d3Selection = require("d3-selection");
const d3Geo = require("d3-geo");
const d3GeoProjection = require("d3-geo-projection");

// Import styles
const styles = require("./MapScroller.scss");

// documentElement is for Firefox support apparently
let screenWidth =
  document.documentElement.clientWidth || document.body.clientWidth; // minus scroll bars
let screenHeight = window.innerHeight;
let margins = screenWidth * 0.05;

function canvasInit(mapData) {
  const australiaGeoLga = topojson.feature(mapData, mapData.objects.LGA_2016_AUST);
  const globe = { type: "Sphere" };

  // Set up a D3 projection here
  const projection = d3Geo
    .geoOrthographic()
    .rotate([-133.7751, 25.2744])
    // .geoMercator()
    // .geoMiller() // Globe projection
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

  // projection.rotate([-133.7751, 25.2744]);

  // projection.scale(1200);

  // projection.rotate([-27, 153]);

  const canvas = d3Selection
    .select("." + styles.stage)
    // .style("background-color", "LIGHTSTEELBLUE")
    .attr("width", screenWidth)
    .attr("height", screenHeight);

  // Set up our canvas drawing context aka pen
  const context = canvas.node().getContext("2d");

  // Build a path generator for our orthographic projection
  const path = d3Geo
    .geoPath()
    .projection(projection)
    .context(context);

  // Draw the inital state of the world
  drawWorld();

  // Check to see if position.sticky is supported
  // and then apply sticky styles
  stickifyStage();

  // Function for clearing and render a frame of each part of the globe
  function drawWorld() {
    // Clear the canvas ready for redraw
    context.clearRect(0, 0, screenWidth, screenHeight);

    // Draw all landmasses
    context.beginPath();
    context.strokeStyle = "rgba(50, 205, 50, 0.9)";
    context.fillStyle = "rgba(0,0,0,0)";
    context.lineWidth = 1;
    path(australiaGeoLga);
    context.fill();
    context.stroke();
  }
}

function stickifyStage() {
  // Detect whether position: sticky is supported (and not Edge browser) and apply styles

  if (Modernizr.csspositionsticky && utils.detectIE() === false) {
    document.body.style.overflowX = "visible";
    document.body.style.overflowY = "visible";

    let scrollyEl = document.querySelector(".scrolly");

    utils.addClass(scrollyEl, "yes-csspositionsticky");
  }
}

class MapScroller extends React.Component {
  componentDidMount() {
    canvasInit(this.props.mapData);
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
          onMarker={stuff => {
            console.log(stuff);
          }}
        >
          <canvas className={styles.stage} />
        </Scrollyteller>
      </div>,
      scrollyteller.mountNode
    );
  }
} // End of MapScroller component

module.exports = MapScroller;
