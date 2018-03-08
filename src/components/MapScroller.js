const React = require("react");
const ReactDOM = require("react-dom");
const Scrollyteller = require("@abcnews/scrollyteller");
const topojson = require("topojson");

// D3 modules
const d3Selection = require("d3-selection");
const d3Geo = require("d3-geo");
const d3GeoProjection = require("d3-geo-projection");

const styles = require("./MapScroller.scss");

// documentElement is for Firefox support apparently
let screenWidth =
  document.documentElement.clientWidth || document.body.clientWidth; // minus scroll bars
let screenHeight = window.innerHeight;
let margins = screenWidth * 0.05;

function canvasInit(mapData) {
  console.log(mapData);

  const australiaGeoLga = topojson.feature(mapData, mapData.objects.aus_lga);
  const globe = { type: "Sphere" };

  console.log(australiaGeoLga);

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
      [[margins - screenWidth * 0.2, margins], [screenWidth - margins, screenHeight - margins]],
      australiaGeoLga
    );

  // projection.rotate([-133.7751, 25.2744]);

  console.log(projection.scale());

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

  stickifyStage();

  // Function for clearing and render a frame of each part of the globe
  function drawWorld() {
    // Clear the canvas ready for redraw
    context.clearRect(0, 0, screenWidth, screenHeight);

    // Draw all landmasses
    context.beginPath();
    context.strokeStyle = "RGBA(50, 205, 50, 0.9)";
    context.fillStyle = "BLANCHEDALMOND";
    context.lineWidth = 1.1;
    path(australiaGeoLga);
    // context.fill();
    context.stroke();
  }
}

function stickifyStage() {
  if (Modernizr.csspositionsticky) {
    console.log(Modernizr);
    document.body.style.overflowX = "visible";
    document.body.style.overflowY = "visible";

    let scrollyEl = document.querySelector(".scrolly");

    console.log(scrollyEl);

    addClass(scrollyEl, "yes-csspositionsticky");
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
          onMarker={() => {}}
        >
          <canvas className={styles.stage} />
        </Scrollyteller>
      </div>,
      scrollyteller.mountNode
    );
  }
} // End of MapScroller component

// Helper functions etc
function hasClass(el, className) {
  return el.classList
    ? el.classList.contains(className)
    : new RegExp("\\b" + className + "\\b").test(el.className);
}

function addClass(el, className) {
  if (el.classList) el.classList.add(className);
  else if (!hasClass(el, className)) el.className += " " + className;
}

function removeClass(el, className) {
  if (el.classList) el.classList.remove(className);
  else
    el.className = el.className.replace(
      new RegExp("\\b" + className + "\\b", "g"),
      ""
    );
}

module.exports = MapScroller;
