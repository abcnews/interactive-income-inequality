const React = require("react");
const styles = require("./App.scss");

// External modules
const d3Q = require("d3-queue");
const d3Request = require("d3-request");
const topojson = require("topojson");

// Other React components
const LgaSearch = require("../LgaSearch/LgaSearch");
const IncomeInput = require("../IncomeInput/IncomeInput");
const MapScroller = require("../MapScroller/MapScroller");
// const MapZoom = require("../MapZoom/MapZoom");

const scrollyteller = require("@abcnews/scrollyteller").loadOdysseyScrollyteller(
  "",
  "u-full",
  "mark"
);

// One map for LGA search (complex) and one for Scrolly map (simplified)
const LGA_GEO_JSON_URL =
  // "http://WS204914.aus.aunty.abc.net.au:8000/LGA_2016_AUST_SEARCH.topo.json";
  "http://www.abc.net.au/res/sites/news-projects/income-comparisons-react/master/LGA_2016_AUST_SEARCH.topo.json";

// const SCROLLER_GEO_JSON_URL =
//   "http://www.abc.net.au/res/sites/news-projects/income-comparisons-react/master/LGA_2016_AUST_MAP.topo.json";

// const PROJECTED_GEO_JSON_URL =
//   "http://www.abc.net.au/res/sites/news-projects/income-comparisons-react/master/LGA_2016_AUST_MAP_PROJECTED.topo.json";

// File scope variables
let LGAs = [];

// React app starts here
class App extends React.Component {
  constructor(props) {
    super(props);

    // console.log(scrollyteller);

    this.state = {
      mapData: null,
      mapDataScroller: null,
      currentLga: null,
      scrollytellerObject: scrollyteller
    };
  }

  // Pass some data up from another component
  // Supposedly bad practice maybe but ¯\_(ツ)_/¯
  setCurrentLga(lgaObject) {
    this.setState({ currentLga: lgaObject });
    if (!lgaObject) return;

    this.setState((prevState, props) => {
      // console.log(prevState.scrollytellerObject);
      prevState.scrollytellerObject.panels[0].nodes[0].innerHTML =
        prevState.currentLga.value;
      prevState.scrollytellerObject.panels[1].config.zoom = 500;
      prevState.scrollytellerObject.panels[1].config.lga =
        prevState.currentLga.value;
      // prevState.scrollytellerObject.panels.shift();
      // console.log(prevState);
      return {
        scrollytellerObject: prevState.scrollytellerObject
      };
    });
  }

  componentWillMount() {
    // Queue up some files to be loaded
    d3Q
      .queue(2) // Concurrent requests
      .defer(d3Request.json, LGA_GEO_JSON_URL)
      // .defer(d3Request.json, SCROLLER_GEO_JSON_URL)
      // .defer(d3Request.json, PROJECTED_GEO_JSON_URL)
      .awaitAll((error, files) => {
        // Once all is loaded do this
        if (error) console.error(error);

        let LGAMap = files[0]; // Load the first file
        // const LGAMapScroller = files[1];
        // const LGAMapProjected = files[1];

        // console.log(LGAMapProjected)

        // Convert TopoJSON into GeoJSON
        const topology = topojson.feature(LGAMap, LGAMap.objects.LGA_2016_AUST); //aus_lga);

        LGAs = topology.features;

        this.setState({ mapData: LGAs, mapDataScroller: LGAMap });

        console.log("External data loaded...");
      });
  }

  render() {
    // const { scrollyteller } = this.props;

    //

    return (
      <div className={styles.root}>
        <IncomeInput />
        <LgaSearch
          setCurrentLga={this.setCurrentLga.bind(this)}
          mapData={this.state.mapData}
        />
        {/* Conditionally render MapScroller if data loaded */}
        {this.state.mapData &&
          this.state.scrollytellerObject && (
            <MapScroller
              scrollyteller={this.state.scrollytellerObject}
              mapData={this.state.mapDataScroller}
              currentLga={this.state.currentLga}
            />
            // <MapZoom
            //   scrollyteller={this.state.scrollytellerObject}
            //   mapData={this.state.mapDataScroller}
            //   currentLga={this.state.currentLga}
            // />
          )}
      </div>
    );
  }
}

module.exports = App;
