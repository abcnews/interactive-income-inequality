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
// "/LGA_2016_AUST_SEARCH.topo.json"

const AUS_STATES_URL =
  "http://www.abc.net.au/res/sites/news-projects/income-comparisons-react/master/australia-states.topo.json";

// const SCROLLER_GEO_JSON_URL =
//   "http://www.abc.net.au/res/sites/news-projects/income-comparisons-react/master/LGA_2016_AUST_MAP.topo.json";

// const PROJECTED_GEO_JSON_URL =
//   "http://www.abc.net.au/res/sites/news-projects/income-comparisons-react/master/LGA_2016_AUST_MAP_PROJECTED.topo.json";

// File scope variables
// let LGAs = [];

// React app starts here
class App extends React.Component {
  constructor(props) {
    super(props);

    this.lgaData = require("./lga-data.json");

    this.state = {
      mapData: null,
      mapDataScroller: null,
      currentLga: null,
      scrollytellerObject: scrollyteller
    };
  }

  // Fires when the user chooses their LGA
  setCurrentLga(lgaObject) {
    if (!lgaObject) return;
    // this.setState({ currentLga: lgaObject });

    // Calculate Australian state from LGA
    let stateCode = Math.floor(lgaObject.value / 10000);
    console.log(stateCode);

    // Modify panels according to LGA choice
    const userLgaText = `In <strong>${
      lgaObject.label
    }</strong>, <9.02> per cent of income earners are in the top bracket, which is <5.18> per cent higher than the average.`;

    this.setState((prevState, props) => {
      let panels = prevState.scrollytellerObject.panels;

      // User's LGA
      panels[1].nodes[0].innerHTML = userLgaText;
      panels[1].config.zoom = 0;
      panels[1].config.lga = lgaObject.value;

      // User's Australian State
      panels[2].config.lga = stateCode;

      return {
        scrollytellerObject: prevState.scrollytellerObject,
        currentLga: lgaObject
      };
    });
  }

  componentWillMount() {
    // Queue up some files to be loaded
    d3Q
      .queue(1) // Concurrent requests
      .defer(d3Request.json, LGA_GEO_JSON_URL)
      .defer(d3Request.json, AUS_STATES_URL)
      // .defer(d3Request.json, SCROLLER_GEO_JSON_URL)
      // .defer(d3Request.json, PROJECTED_GEO_JSON_URL)
      .awaitAll((error, files) => {
        console.log("External data loaded...");
        // Once all is loaded do this
        if (error) console.error(error);

        let LGAMap = files[0]; // Load the first file
        let ausStates = files[1]; // Load the second file

        // Convert TopoJSON into GeoJSON
        const LGAs = topojson.feature(LGAMap, LGAMap.objects.LGA_2016_AUST)
          .features;

        // const LGAs = topology;

        const ausStatesGeo = topojson.feature(
          ausStates,
          ausStates.objects.states
        );

        // console.log(ausStatesGeo)

        this.setState({
          mapData: LGAs,
          mapDataScroller: LGAMap,
          ausStatesGeo: ausStatesGeo
        });
      });
  }

  render() {
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
              ausStatesGeo={this.state.ausStatesGeo}
              lgaData={this.lgaData}
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
