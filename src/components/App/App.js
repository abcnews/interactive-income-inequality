const React = require("react");
const styles = require("./App.scss");

// External modules
const d3Q = require("d3-queue");
const d3Request = require("d3-request");
// const inside = require("point-in-polygon");
const topojson = require("topojson");
// const MapboxClient = require("mapbox");

// Other React components
const LgaSearch = require("../LgaSearch/LgaSearch");
const IncomeInput = require("../IncomeInput/IncomeInput");
const MapScroller = require("../MapScroller/MapScroller");

// One map for LGA search (complex) and one for Scrolly map (simplified)
const LGA_GEO_JSON_URL =
  // "http://WS204914.aus.aunty.abc.net.au:8000/LGA_2016_AUST_SEARCH.topo.json";
  "http://www.abc.net.au/res/sites/news-projects/income-comparisons-react/master/LGA_2016_AUST_SEARCH.topo.json";

const SCROLLER_GEO_JSON_URL =
  // "http://WS204914.aus.aunty.abc.net.au:8000/LGA_2016_AUST_MAP.topo.json";
  "http://www.abc.net.au/res/sites/news-projects/income-comparisons-react/master/LGA_2016_AUST_MAP.topo.json";


// File scope variables
let LGAs = [];


// React app starts here
class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      localGovernmentArea: {},
      mapData: null,
      mapDataScroller: null,
      lgaCode: {}
    };
  }

  // Pass some data up from another component
  // Supposedly bad practice maybe but ¯\_(ツ)_/¯
  setLgaCode(code) {
    this.setState({ lgaCode: code });
  }

  componentWillMount() {
    // Queue up some files to be loaded
    d3Q
      .queue(2) // Concurrent requests
      .defer(d3Request.json, LGA_GEO_JSON_URL)
      .defer(d3Request.json, SCROLLER_GEO_JSON_URL)
      .awaitAll((error, files) => {
        // Once all is loaded do this
        if (error) console.error(error);

        const LGAMap = files[0]; // Load the first file
        const LGAMapScroller = files[1];

        // Convert TopoJSON into GeoJSON
        const topology = topojson.feature(LGAMap, LGAMap.objects.LGA_2016_AUST); //aus_lga);

        LGAs = topology.features;

        this.setState({ mapData: LGAs, mapDataScroller: LGAMapScroller });

        console.log("External data loaded...");
      });
  }

  render() {
    const { scrollyteller } = this.props;

    return (
      <div className={styles.root}>
        <IncomeInput />
        <LgaSearch
          // geoCodeAddress={this.geoCodeAddress.bind(this)}
          onLgaCodeSelect={this.setLgaCode.bind(this)}
          // localGovernmentArea={this.state.localGovernmentArea}
          mapData={this.state.mapData}
        />
        <div>{this.state.lgaCode.label}</div>
        {/* Conditionally render MapScroller if data loaded */}
        {this.state.mapData && (
          <MapScroller
            scrollyteller={scrollyteller}
            mapData={this.state.mapDataScroller}
          />
        )}
      </div>
    );
  }
}

module.exports = App;
