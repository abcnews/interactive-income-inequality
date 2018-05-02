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
const Dumbbell = require("../Dumbbell/Dumbbell");
const DumbbellTop = require("../DumbbellTop/DumbbellTop");

const scrollyteller = require("@abcnews/scrollyteller").loadOdysseyScrollyteller(
  "",
  "u-full",
  "mark"
);

// One map for LGA search (complex) and one for Scrolly map (simplified)
const baseURL =
  "http://www.abc.net.au/res/sites/news-projects/income-comparisons-react/master/";
const LGA_GEO_JSON_URL =
  // "http://WS204914.aus.aunty.abc.net.au:8000/LGA_2016_AUST_SEARCH.topo.json";
  baseURL + "LGA_2016_AUST_SEARCH.topo.json";
// "/LGA_2016_AUST_SEARCH.topo.json"

const LGA_TOP_DATA_URL = baseURL + "lga-top-data.csv";

const AUS_STATES_URL = baseURL + "australia-states.topo.json";

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

    this.lgaData = [];

    this.state = {
      mapData: null,
      mapDataScroller: null,
      currentLga: null,
      currentAusState: 1,
      scrollytellerObject: scrollyteller
    };

    this.setCurrentLga = this.setCurrentLga.bind(this);
    this.doMarkerEvent = this.doMarkerEvent.bind(this);
  }

  doMarkerEvent(stateCode) {
    // TODO: after implementing per LGA fade outs enable this
    // this.setState({ currentAusState: stateCode });
  }

  // Fires when the user chooses their LGA
  setCurrentLga(lgaObject) {
    if (!lgaObject) return;

    // Get top percentile stats from data
    let currentTopPercentValue = getLgaTop(this.lgaData, lgaObject.value).TOP;
    let percentageDifference = currentTopPercentValue - 3.84; // Aust-wide percent in top bracket
    let currentRank = getLgaTop(this.lgaData, lgaObject.value).RANK;

    /*
     * First set up user panel
     */

    // Determine higher or lower
    function higherOrLower(difference) {
      if (difference < 0) return "lower";
      else return "higher";
    }

    // Modify panels according to LGA choice
    const userLgaText = `In <strong>${
      lgaObject.label.replace(/ *\([^)]*\) */g, "") // Strip (NSW) etc.
    }</strong> LGA, <strong>${currentTopPercentValue}</strong> per cent of income earners are in the top bracket, which is <strong>${Math.abs(
      percentageDifference.toFixed(2)
    )}</strong> percentage points ${higherOrLower(
      percentageDifference
    )} than the average.`;

    const userRankText = `It is ranked <strong>${currentRank}</strong> out of all LGAs in Australia on this measure.`;

    /*
     * Then set up Australian state panel
     */

    // Calculate Australian state from LGA
    let stateCode = Math.floor(lgaObject.value / 10000);

    let getStateInfo = stateCode => {
      if (stateCode === 1) {
        return {
          text: "New South Wales",
          percent: "4.35",
          leadLga: "Mosman",
          leadLgaCode: 15350,
          leadLgaPercent: 23.81
        };
      } else if (stateCode === 2) {
        return {
          text: "Victoria",
          percent: "3.66",
          leadLga: "Bayside",
          leadLgaCode: 20910,
          leadLgaPercent: 14.37
        };
      } else if (stateCode === 3) {
        return {
          text: "Queensland",
          percent: "3.14",
          leadLga: "Isaac",
          leadLgaCode: 33980,
          leadLgaPercent: 10.18
        };
      } else if (stateCode === 4) {
        return {
          text: "South Australia",
          percent: "2.32",
          leadLga: "Walkerville",
          leadLgaCode: 48260,
          leadLgaPercent: 10.48
        };
      } else if (stateCode === 5) {
        return {
          text: "Western Australia",
          percent: "5.27",
          leadLga: "Ashburton",
          leadLgaCode: 50250,
          leadLgaPercent: 34.7
        };
      } else if (stateCode === 6) {
        return {
          text: "Tasmania",
          percent: "1.78",
          leadLga: "Hobart",
          leadLgaCode: 62810,
          leadLgaPercent: 4.67
        };
      } else if (stateCode === 7) {
        return {
          text: "Northern Territory",
          percent: "4.73",
          leadLga: "Unincorporated NT",
          leadLgaCode: 79399,
          leadLgaPercent: 7.29
        };
      } else if (stateCode === 8) {
        return {
          text: "Australian Capital Territory",
          percent: "5.47",
          leadLga: "Unicorporated ACT",
          leadLgaCode: 89399,
          leadLgaPercent: 5.47
        };
      } else if (stateCode === 9) {
        return { text: "Unclassified Areas", percent: "2.12" };
      } else {
        return {
          text: "NOT FOUND",
          percent: "0.00",
          leadLga: "NOT FOUND",
          leadLgaCode: 0,
          leadLgaPercent: 0.0
        };
      }
    };

    let statePercentDifferent = getStateInfo(stateCode).percent - 3.84;

    const stateText = `In <strong>${
      getStateInfo(stateCode).text
    }</strong>, <strong>${
      getStateInfo(stateCode).percent
    }</strong> per cent of income earners are in the top bracket, which is <strong>${Math.abs(
      statePercentDifferent.toFixed(2)
    )}</strong> percentage points ${higherOrLower(
      statePercentDifferent
    )} than the average.`;

    // *
    // * Lastly set up the top LGA in State
    // *

    let leadLga = getStateInfo(stateCode).leadLga;
    let leadLgaCode = getStateInfo(stateCode).leadLgaCode;
    let leadLgaPercent = getStateInfo(stateCode).leadLgaPercent;
    let leadLgaRank = getLgaTop(this.lgaData, leadLgaCode).RANK;

    let leadPanelText = `Leading the pack in your state is <strong>${leadLga}</strong>, where <strong>${leadLgaPercent}</strong> per cent of income earners are in the top bracket.`;

    let leadPanelRankText = `It is ranked number <strong>${leadLgaRank}</strong> out of all LGAs in Australia on this measure.`;

    // Then update the component state which will change text on all panels
    this.setState((prevState, props) => {
      let panels = prevState.scrollytellerObject.panels;

      // User's LGA
      panels[1].nodes[0].innerHTML = userLgaText;
      panels[1].nodes[1].innerHTML = userRankText;
      panels[1].config.zoom = 0;
      panels[1].config.lga = lgaObject.value;

      // User's Australian State
      panels[2].config.lga = stateCode;
      panels[2].nodes[0].innerHTML = stateText;

      // Lead LGA in User's Australian State
      panels[3].config.lga = leadLgaCode;
      panels[3].nodes[0].innerHTML = leadPanelText;
      panels[3].nodes[1].innerHTML = leadPanelRankText;

      return {
        scrollytellerObject: prevState.scrollytellerObject,
        currentLga: lgaObject,
        currentAusState: stateCode
      };
    });
  }

  componentWillMount() {
    // Queue up some files to be loaded
    d3Q
      .queue(1) // Concurrent requests
      .defer(d3Request.json, LGA_GEO_JSON_URL)
      .defer(d3Request.json, AUS_STATES_URL)
      .defer(d3Request.csv, LGA_TOP_DATA_URL)
      // .defer(d3Request.json, SCROLLER_GEO_JSON_URL)
      // .defer(d3Request.json, PROJECTED_GEO_JSON_URL)
      .awaitAll((error, files) => {
        console.log("External data loaded...");
        // Once all is loaded do this
        if (error) console.error(error);

        let LGAMap = files[0]; // Load the first file
        let ausStates = files[1]; // Load the second file
        this.lgaData = files[2];

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
          setCurrentLga={this.setCurrentLga}
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
              currentAusState={this.state.currentAusState}
              doMarkerEvent={this.doMarkerEvent}
            />
          )}
        <DumbbellTop>
          <Dumbbell
            label="Medical practitioners"
            dot1Percent="10"
            dot2Percent="72.2"
          />
          <Dumbbell
            label="CEOs, General Managers and Legislators"
            dot1Percent="10"
            dot2Percent="71.9"
          />
          <Dumbbell
            label="Business Administration Managers"
            dot1Percent="10"
            dot2Percent="56.8"
          />
          <Dumbbell
            label="Construction, Distribution &amp; Production Managers"
            dot1Percent="10"
            dot2Percent="56.8"
          />
          <Dumbbell
            label="Legal Professionals"
            dot1Percent="10"
            dot2Percent="36.8"
          />
        </DumbbellTop>
      </div>
    );
  }
}

function getLgaTop(lgaData, lgaCode) {
  return lgaData.find(lga => +lga.LGA_CODE_2016 === lgaCode);
}

module.exports = App;
