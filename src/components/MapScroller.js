const React = require("react");
const ReactDOM = require("react-dom");
const Scrollyteller = require("@abcnews/scrollyteller");
const topojson = require("topojson");

// D3 modules
const d3Selection = require("d3-selection");
const d3Geo = require("d3-geo");
const d3GeoProjection = require("d3-geo-projection");

const styles = require("./MapScroller.scss");

let screenWidth = window.innerWidth;
let screenHeight = window.innerHeight;
let margins = 100;

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
          className={`Block is-richtext is-piecemeal ${styles.scrollyteller}`}
          panelClassName="Block-content u-layout u-richtext"
          onMarker={console.log}
        >
          <canvas className={styles.stage} />
        </Scrollyteller>
      </div>,
      scrollyteller.mountNode
    );
  }
} // End of MapScroller component

function canvasInit(mapData) {
  console.log(mapData);

  const australiaGeoLga = topojson.feature(mapData, mapData.objects.aus_lga);
  const sphere = { type: "Sphere" };

  console.log(australiaGeoLga);

  // Set up a D3 projection here
  const projection = d3GeoProjection
    .geoMiller() // Globe projection
    // .translate([screenWidth / 2, screenHeight / 2])
    // .clipAngle(90) // Only display front side of the world
    .precision(0.1)
    .fitExtent(
      // Auto zoom
      [[margins, margins], [screenWidth - margins, screenHeight - margins]],
      australiaGeoLga
    );
  const canvas = d3Selection
    .select("." + styles.stage)
    .style("background-color", "LIGHTSTEELBLUE")
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

  // Function for clearing and render a frame of each part of the globe
  function drawWorld() {
    // Clear the canvas ready for redraw
    context.clearRect(0, 0, screenWidth, screenHeight);

    // Draw all landmasses
    context.beginPath();
    context.strokeStyle = "SANDYBROWN";
    context.fillStyle = "ROSYBROWN";
    context.lineWidth = 1.1;
    path(australiaGeoLga);
    context.fill();
    context.stroke();
  }
}

module.exports = MapScroller;
