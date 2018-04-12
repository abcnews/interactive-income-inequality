const React = require("react");
const ReactDOM = require("react-dom");
const Scrollyteller = require("@abcnews/scrollyteller");
const topojson = require("topojson");

const d3 = require("d3");

// const styles = require('./MapZoom.scss');

function onMounted() {
  console.log("mounted");
  var canvas = d3.select("canvas#render");
  var hidden = d3.select("canvas#hidden"),
    context = canvas.node().getContext("2d"),
    contextHdn = hidden.node().getContext("2d"),
    width = canvas.property("width"),
    height = canvas.property("height"),
    zoomPercentage = 0.9; // let 10% padding

  var selectedId = null,
    selectedFeature = null,
    selectedSpan = document.getElementById("selectedId"),
    resetButton = d3.select("button#resetZoom");

  var land, borders;

  var scale,
    translate,
    visibleArea, // minimum area threshold for points inside viewport
    invisibleArea; // minimum area threshold for points outside viewport

  var simplify = d3.geoTransform({
    point: function(x, y, z) {
      if (z < visibleArea) return;

      x = x * scale + translate[0];
      y = y * scale + translate[1];

      if (
        (x >= -10 && x <= width + 10 && y >= -10 && y <= height + 10) ||
        z >= invisibleArea
      ) {
        this.stream.point(x, y);
      }
    }
  });

  // Needed to get the lat lng of bounding box
  // https://bl.ocks.org/Fil/a8cfbbfd0100d38241beb48d23c9d4d1
  simplify.invert = function(u) {
    return [(u[0] - translate[0]) / scale, (u[1] - translate[1]) / scale];
  };

  //***    Original zoom from Mike Bostock   ***//
  //*** https://bl.ocks.org/mbostock/7755778 ***//

  // An arbitrary scale and center point to set the initial view.
  // This projection is baked into the TopoJSON file,
  // but is used here to compute the desired zoom translate.
  var backed = {
    projection: d3
      .geoMercator()
      .translate([0, 0])
      .scale(100)
  };

  var zoom = d3.zoom().on("zoom", zoomed);

  // styling
  context.lineJoin = "round";
  context.lineCap = "round";
  var cssStyles = {
    fill: "#bbb",
    stroke: "#fff",
    selected: {
      fill: "rgba(0, 0, 0, 0.5)",
      stroke: "red"
    }
  };

  var path = d3
    .geoPath()
    .projection(simplify)
    .context(context);

  console.log("path");

  d3.json("http://localhost:8000/LGA_2016_AUST_MAP_PROJECTED.topo.json", function(error, us) {
    // if (error) throw error;

    console.log(us)

    topojson.presimplify(us);
    land = topojson.feature(us, us.objects.LGA_2016_AUST);
    borders = topojson.mesh(us, us.objects.LGA_2016_AUST, (a, b) => a !== b);

    canvas.call(zoom).on("click", onClick);

    resetButton.on("click", () => {
      // For exemple, NY latlng
      zoomTo([-75.959, 38.25]);
    });

    // Init, reset zoom
    resetButton.dispatch("click");
  });

  function zoomed(d) {
    var z = d3.event.transform;
    translate = [z.x, z.y];
    scale = z.k;
    visibleArea = 1 / scale / scale;
    invisibleArea = 200 * visibleArea;

    draw();
  }

  function onClick() {
    getHiddenData();
    zoomTo(selectedFeature);
  }

  // Retrieve the id with the color, and so, the feature. https://bl.ocks.org/Lacroute/579bc326fb547110a959c0a9ac2b30ce
  function getHiddenData() {
    path.context(contextHdn);
    drawHidden();

    let mouse = d3.mouse(canvas.node());
    let data = contextHdn.getImageData(mouse[0], mouse[1], 1, 1).data;
    selectedId = data[0];
    selectedFeature = land.features.find(f => +f.id === selectedId);

    path.context(context);
  }

  // Zoom to bounding box of the selected area.
  function zoomTo(location) {
    if (location === undefined) return;

    let point,
      sc = 1;
    if (!Array.isArray(location)) {
      let bounds = path.bounds(location),
        dx = bounds[1][0] - bounds[0][0],
        dy = bounds[1][1] - bounds[0][1],
        x = (bounds[0][0] + bounds[1][0]) / 2,
        y = (bounds[0][1] + bounds[1][1]) / 2;

      let factor = Math.min(width / dx, height / dy);
      sc = factor * scale * zoomPercentage;
      location = backed.projection.invert(simplify.invert([x, y]));

      // If you prefer zoom to the centroid
      // location = backed.projection.invert(simplify.invert(path.centroid(location)))
    }

    point = backed.projection(location);

    // Apply the new transform
    canvas
      .transition()
      .duration(750)
      .call(
        zoom.transform,
        d3.zoomIdentity
          .translate(width / 2 - point[0] * sc, height / 2 - point[1] * sc)
          .scale(sc)
      );
  }

  // Main drawing loop
  function draw() {
    context.clearRect(0, 0, width, height);
    context.fillStyle = cssStyles.fill;
    context.strokeStyle = cssStyles.stroke;

    context.beginPath();
    path(land);
    context.fill();
    context.beginPath();
    path(borders);
    context.stroke();

    if (selectedFeature) drawSelected();

    drawCenter();
  }

  // Highlight the selected feature
  function drawSelected() {
    selectedSpan.innerHTML = selectedId;
    context.fillStyle = cssStyles.selected.fill;
    context.strokeStyle = cssStyles.selected.stroke;
    context.beginPath();
    path(selectedFeature);
    context.fill();
    context.stroke();

    // Draw his centroid
    context.beginPath();
    let cent = path.centroid(selectedFeature);
    context.arc(cent[0], cent[1], 3, 0, 2 * Math.PI);
    context.fillStyle = "green";
    context.strokeStyle = "white";
    context.stroke();
    context.fill();
  }

  // Draw a cross in the center of the canvas
  function drawCenter() {
    context.beginPath();
    let x = width / 2;
    let y = height / 2;

    context.strokeStyle = "green";
    context.moveTo(x - 10, y - 10);
    context.lineTo(x + 10, y + 10);
    context.stroke();

    context.moveTo(x + 10, y - 10);
    context.lineTo(x - 10, y + 10);
    context.stroke();
  }

  // Drawing method to encode id to color
  function drawHidden() {
    contextHdn.clearRect(0, 0, width, height);
    land.features.map(f => {
      contextHdn.beginPath();
      path(f);
      // basic exemple because there is less than 255 counties
      contextHdn.fillStyle = `rgba(${f.id}, 0, 0, 1)`;
      contextHdn.fill();
    });
  }
}

class MapZoom extends React.Component {
  constructor(props) {
    super(props);

    this.initGraph = this.initGraph.bind(this);
    this.updateGraph = this.updateGraph.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    // TODO: Add any conditions that mitigate updating the graph
    this.updateGraph(nextProps);
  }

  shouldComponentUpdate() {
    // Stop Preact from managing the DOM itself
    return false;
  }

  componentDidMount() {
    // this.initGraph(this.props);

    onMounted();

    // TODO: add any listeners here
    // ...
  }

  componentWillUnmount() {
    // TODO: remove any listeners here
    // ...
  }

  /**
   * Initialize the graph
   * @param {object} props The latest props that were given to this component
   */
  initGraph(props) {
    if (!this.wrapper) return;

    this.svg = d3
      .select(this.wrapper)
      .append("svg")
      .attr("width", 400)
      .attr("height", 300);

    this.g = this.svg.append("g").attr("fill", "black");

    this.rect = this.g
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("rx", 3)
      .attr("ry", 3)
      .attr("width", 400)
      .attr("height", 300);
  }

  /**
   * Update the graph. It is important to only update this component through normal D3 methods.
   * @param {object} props The latest props given to this component
   */
  updateGraph(props) {
    if (!this.wrapper) return;

    // TODO: Use D3 to update the graph
  }

  render() {
    return (
      <div >
        <div style={{position: "absolute"}}>
          <button id="resetZoom">Reset zoom</button>
          <p style={{display: "inline-block"}}>
            Selected id: <span id="selectedId" />
          </p>
        </div>
        <canvas id="render" width="960" height="500" />
        <canvas id="hidden" width="960" height="500" />
      </div>
    );
  }
}

module.exports = MapZoom;
