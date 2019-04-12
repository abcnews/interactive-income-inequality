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

// Dumbbell charts
const Dumbbell = require("../Dumbbell/Dumbbell");
const DumbbellTop = require("../DumbbellTop/DumbbellTop");
const DumbbellUser = require("../DumbbellUser/DumbbellUser");
const DumbbellEducation = require("../DumbbellEducation/DumbbellEducation");
const DumbbellGender = require("../DumbbellGender/DumbbellGender");
const DumbbellIndigenous = require("../DumbbellIndigenous/DumbbellIndigenous");
const DumbbellMarriage = require("../DumbbellMarriage/DumbbellMarriage");
const DumbbellCar = require("../DumbbellCar/DumbbellCar");
const DumbbellBorn = require("../DumbbellBorn/DumbbellBorn");
const DumbbellVoluntary = require("../DumbbellVoluntary/DumbbellVoluntary");
const DumbbellContMarriage = require("../DumbbellContMarriage/DumbbellContMarriage");

const scrollyteller = require("@abcnews/scrollyteller").loadOdysseyScrollyteller(
  "",
  "u-full",
  "mark"
);

// Let devs specify a custom base URL
const fragmentData = document.querySelector("[data-income-comparisons-root]");

// One map for LGA search (complex) and one for Scrolly map (simplified)
let baseURL = "/";

// Get baseURL from HTML Fragment
if (fragmentData && fragmentData.dataset.rootUrl)
  baseURL = fragmentData.dataset.rootUrl;

if (__webpack_public_path__) baseURL = __webpack_public_path__;

// A detailed map used to search LGAs. Other maps are derived from this one using topojson
const LGA_GEO_JSON_URL = baseURL + "LGA_2016_AUST_SEARCH.topo.json";

// LGA Rankings
const LGA_TOP_DATA_URL = baseURL + "lga-top-data.csv";

// Used to determine zooming levels for Australian States
// This could also be achieved using d3Geo.merge or similar on the full map
const AUS_STATES_URL = baseURL + "australia-states.topo.json";

// For the top 5 in top brackets
const topBracketData = require("./top-bracket-data.json");

const NATIONAL_AVERAGE_IN_TOP = 3.8;

// Get the top 5 for the dumbbell charts
const getUserTopJobsData = (data, bracket) => {
  let userData = {};

  data.forEach(job => {
    userData[job.jobCode] = job[bracket];
  });

  return userData;
};

// For the top 5 in user's bracket
let userBracketData = require("./user-top-brackets.json");

const getUserBracketData = (data, bracket) => {
  return data.find(br => br.bracket === bracket);
};

// Main React app starts here
class App extends React.Component {
  constructor(props) {
    super(props);

    this.lgaData = [];

    this.state = {
      mapData: null,
      mapDataScroller: null,
      currentLga: null,
      currentAusState: 1, // default NSW
      scrollytellerObject: scrollyteller,
      currentBracketNumber: 8, // default bracket
      hasSetBracket: false
    };

    // Bind the this to methods
    this.setCurrentLga = this.setCurrentLga.bind(this);
    this.setCurrentBracket = this.setCurrentBracket.bind(this);
  }

  componentDidMount() {
    // Hide top bracket paragraphs
    let veryTop = document.querySelectorAll(".verytop");
    let notTop = document.querySelectorAll(".nottop");

    veryTop.forEach(paragraph => {
      paragraph ? paragraph.classList.add(styles.hidden) : null;
    });

    notTop.forEach(paragraph => {
      paragraph ? paragraph.classList.remove(styles.hidden) : null;
    });
    // veryTop ? veryTop.classList.add(styles.hidden) : null;
    // notTop ? notTop.classList.remove(styles.hidden) : null;
  }

  setCurrentBracket(bracketNumber) {
    this.setState(
      { currentBracketNumber: bracketNumber, hasSetBracket: true },
      () => {
        setTimeout(() => {
          // Update text if someone is in the top bracket
          let isInTopBracket = this.state.currentBracketNumber === 13;
          // let veryTop = document.querySelector(".verytop");
          // let notTop = document.querySelector(".nottop");
          let veryTop = document.querySelectorAll(".verytop");
          let notTop = document.querySelectorAll(".nottop");

          if (isInTopBracket) {
            veryTop.forEach(paragraph => {
              paragraph ? paragraph.classList.remove(styles.hidden) : null;
            });

            notTop.forEach(paragraph => {
              paragraph ? paragraph.classList.add(styles.hidden) : null;
            });

            // veryTop ? veryTop.classList.remove(styles.hidden) : null;

            // notTop ? notTop.classList.add(styles.hidden) : null;
          } else {
            veryTop.forEach(paragraph => {
              paragraph ? paragraph.classList.add(styles.hidden) : null;
            });

            notTop.forEach(paragraph => {
              paragraph ? paragraph.classList.remove(styles.hidden) : null;
            });

            // veryTop ? veryTop.classList.add(styles.hidden) : null;

            // notTop ? notTop.classList.remove(styles.hidden) : null;
          }
        }, 1000);
      }
    );
  }

  // Fires when the user chooses their LGA
  setCurrentLga(lgaObject) {
    if (!lgaObject) return;

    // Get top percentile stats from data
    let currentTopPercentValue = +getLgaTop(this.lgaData, lgaObject.value).TOP;
    let percentageDifference =
      currentTopPercentValue.toFixed(1) - NATIONAL_AVERAGE_IN_TOP; // Aust-wide percent in top bracket
    let currentRank = getLgaTop(this.lgaData, lgaObject.value).RANK;

    // To compare with highest in state
    let userLgaCode = lgaObject.value;

    /*
     * First set up user panel
     */

    // Determine higher or lower
    function higherOrLower(difference) {
      if (difference < 0) return "lower";
      else return "higher";
    }

    // Modify panels according to LGA choice
    // Note: modified to detect singular and plural
    // Also modified to be "on par with national average if zero"
    const roundedPercentageDifference = Math.abs(
      percentageDifference.toFixed(1)
    );
    const userLgaText = `In the <strong>${
      lgaObject.label.replace(/ *\([^)]*\) */g, "") // Strip (NSW) etc.
    }</strong> LGA, <strong>${+currentTopPercentValue.toFixed(
      1
    )} per cent</strong> of income earners are in the top bracket, which is 
    ${
      roundedPercentageDifference === 0
        ? "on par with the national average."
        : `<strong>${roundedPercentageDifference}</strong> percentage ${
            roundedPercentageDifference === 1 ? "point" : "points"
          } ${higherOrLower(percentageDifference)} than the average.`
    }`;

    const userRankText = `It is ranked <strong>${currentRank}</strong> out of all 547 LGAs in Australia.`;

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

    const statePercentDifferent =
      parseFloat(getStateInfo(stateCode).percent).toFixed(1) - NATIONAL_AVERAGE_IN_TOP; // National average

    const roundedStatePercentDifferent = Math.abs(
      statePercentDifferent.toFixed(1)
    );
    const stateText = `Zooming ${
      getStateInfo(stateCode).text !== "Australian Capital Territory"
        ? "out"
        : ""
    } to <strong>${getStateInfo(stateCode).text}</strong>, <strong>${parseFloat(
      getStateInfo(stateCode).percent
    ).toFixed(
      1
    )} per cent</strong> of income earners are in the top bracket, which is 
    ${
      roundedStatePercentDifferent === 0
        ? "on par with the national average."
        : `<strong>${roundedStatePercentDifferent}</strong> percentage ${
            roundedStatePercentDifferent == 1 ? "point" : "points"
          } ${higherOrLower(statePercentDifferent)} than the average.`
    }`;

    // *
    // * Lastly set up the top LGA in State
    // *

    let leadLga = getStateInfo(stateCode).leadLga;
    let leadLgaCode = getStateInfo(stateCode).leadLgaCode;
    let leadLgaPercent = getStateInfo(stateCode).leadLgaPercent;
    let leadLgaRank = getLgaTop(this.lgaData, leadLgaCode).RANK;
    let leadLgaState = getStateInfo(stateCode).text;

    // Find out if user is in the top LGA for that State
    let leadPanelText;
    let leadPanelRankText;

    if (userLgaCode === leadLgaCode) {
      leadPanelText = `Your LGA, <strong>${leadLga}</strong>, has the highest concentration of top income earners in ${leadLgaState} at <strong>${leadLgaPercent.toFixed(
        1
      )} per cent</strong>.`;
      leadPanelRankText = `It is ranked number <strong>${leadLgaRank}</strong> out of all LGAs in Australia on this measure.`;
    } else {
      leadPanelText = `The area with the highest concentration of top earners in ${leadLgaState} is <strong>${leadLga}</strong>, at <strong>${leadLgaPercent.toFixed(
        1
      )} per cent</strong>.`;
      leadPanelRankText = `It is ranked number <strong>${leadLgaRank}</strong> out of all LGAs in Australia on this measure.`;
    }

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

      if (leadPanelRankText === "") {
        panels[3].nodes[0].style.marginBottom = "0px";
      } else {
        panels[3].nodes[0].style.marginBottom = "2.25rem";
      }

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
      .awaitAll((error, files) => {
        // Once all is loaded do this
        if (error) console.error(error);

        let LGAMap = files[0]; // Load the first file
        let ausStates = files[1]; // Load the second file
        this.lgaData = files[2];

        // Convert TopoJSON into GeoJSON
        const LGAs = topojson.feature(LGAMap, LGAMap.objects.LGA_2016_AUST)
          .features;

        const ausStatesGeo = topojson.feature(
          ausStates,
          ausStates.objects.states
        );

        this.setState({
          mapData: LGAs,
          mapDataScroller: LGAMap,
          ausStatesGeo: ausStatesGeo
        });
      });
  }

  render() {
    let top5 = getUserTopJobsData(
      topBracketData,
      this.state.currentBracketNumber
    );

    let user = getUserBracketData(
      userBracketData,
      this.state.currentBracketNumber
    );

    let isInTopBracket = this.state.currentBracketNumber === 13;

    // For this project only we know 1 value will be 12.29% so stretch the bounds a bit
    let dumbbellUserMax = 10;
    if (this.state.currentBracketNumber === 1) dumbbellUserMax = 13;

    return (
      <div className={styles.root}>
        <IncomeInput setCurrentBracket={this.setCurrentBracket} />
        <LgaSearch
          setCurrentLga={this.setCurrentLga}
          mapData={this.state.mapData}
        />

        {/* Conditionally render MapScroller if data loaded */}
        {this.state.mapData && this.state.scrollytellerObject && (
          <MapScroller
            scrollyteller={this.state.scrollytellerObject}
            mapData={this.state.mapDataScroller}
            currentLga={this.state.currentLga}
            ausStatesGeo={this.state.ausStatesGeo}
            lgaData={this.lgaData}
            currentAusState={this.state.currentAusState}
          />
        )}

        {/* Top 5 jobs in top bracket */}
        {this.state.currentBracketNumber !== 13 && (
          <DumbbellTop>
            <Dumbbell
              label="Medical practitioners"
              dot1Percent={this.state.hasSetBracket ? top5[1] : false}
              dot1Label={this.state.hasSetBracket ? "Your bracket" : false}
              dot2Percent={7.22}
              dot2Label="Top bracket"
              line1Percent={0.56}
              line1Label="Avg. of all brackets"
              percentMultiplier={1}
              maxValue={10}
              isInTopBracket={isInTopBracket}
            />
            <Dumbbell
              label="CEOs, General Managers and Legislators"
              dot1Percent={this.state.hasSetBracket ? top5[2] : false}
              dot2Percent="7.19"
              line1Percent="0.72"
              percentMultiplier={1}
              maxValue={10}
              isInTopBracket={isInTopBracket}
            />
            <Dumbbell
              label="Business Administration Managers"
              dot1Percent={this.state.hasSetBracket ? top5[3] : false}
              dot2Percent="5.68"
              line1Percent="0.88"
              percentMultiplier={1}
              maxValue={10}
              isInTopBracket={isInTopBracket}
            />
            <Dumbbell
              label="Construction, Distribution &amp; Production Managers"
              dot1Percent={this.state.hasSetBracket ? top5[4] : false}
              dot2Percent="5.68"
              line1Percent="1.39"
              percentMultiplier={1}
              maxValue={10}
              isInTopBracket={isInTopBracket}
            />
            <Dumbbell
              label="Legal Professionals"
              dot1Percent={this.state.hasSetBracket ? top5[5] : false}
              dot2Percent="3.68"
              line1Percent="0.45"
              percentMultiplier={1}
              maxValue={10}
              isInTopBracket={isInTopBracket}
            />
          </DumbbellTop>
        )}

        {/* If user is in top bracket show this instead */}
        {this.state.currentBracketNumber === 13 && (
          <DumbbellTop>
            <Dumbbell
              label="Medical practitioners"
              dot1Percent={this.state.hasSetBracket ? top5[1] : false}
              dot1Label="Your bracket"
              dot2Percent="0.01"
              dot2Label="Bottom bracket"
              dot2Color="#607477"
              dot2TextColor="#607477"
              dot2LabelColor="#607477"
              line1Percent="0.56"
              line1Label="Avg. of all brackets"
              percentMultiplier={1}
              maxValue={10}
              isInTopBracket={isInTopBracket}
            />
            <Dumbbell
              label="CEOs, General Managers and Legislators"
              dot1Percent={this.state.hasSetBracket ? top5[2] : false}
              dot2Percent="0.05"
              dot2Color="#607477"
              dot2TextColor="#607477"
              line1Percent="0.72"
              percentMultiplier={1}
              maxValue={10}
              isInTopBracket={isInTopBracket}
            />
            <Dumbbell
              label="Business Administration Managers"
              dot1Percent={this.state.hasSetBracket ? top5[3] : false}
              dot2Percent="0.03"
              dot2Color="#607477"
              dot2TextColor="#607477"
              line1Percent="0.88"
              percentMultiplier={1}
              maxValue={10}
              isInTopBracket={isInTopBracket}
            />
            <Dumbbell
              label="Construction, Distribution &amp; Production Managers"
              dot1Percent={this.state.hasSetBracket ? top5[4] : false}
              dot2Percent="0.13"
              dot2Color="#607477"
              dot2TextColor="#607477"
              line1Percent="1.39"
              percentMultiplier={1}
              maxValue={10}
              isInTopBracket={isInTopBracket}
            />
            <Dumbbell
              label="Legal Professionals"
              dot1Percent={this.state.hasSetBracket ? top5[5] : false}
              dot2Percent="0.02"
              dot2Color="#607477"
              dot2TextColor="#607477"
              line1Percent="0.45"
              percentMultiplier={1}
              maxValue={10}
              isInTopBracket={isInTopBracket}
            />
          </DumbbellTop>
        )}

        {/*
          Check that the user is not in the top 3.8% bracket
          And if no bracket set, just hide 
        */}
        {this.state.currentBracketNumber !== 13 && this.state.hasSetBracket && (
          <DumbbellUser>
            <p className={styles.paragraphText}>
              Now, let's look at the five most common jobs for people in your
              tax bracket. Only{" "}
              <strong>
                {" "}
                {parseFloat(
                  user.top1 + user.top2 + user.top3 + user.top4 + user.top5
                ).toFixed(2)}{" "}
                per cent
              </strong>{" "}
              of people in those jobs make it into the top earners group.
            </p>

            <Dumbbell
              label={user.name1}
              dot1Percent={user.value1}
              dot1Label="Your bracket"
              dot2Percent={user.top1}
              dot2Label="Top bracket"
              line1Percent={user.average1}
              line1Label="Avg. of all brackets"
              percentMultiplier={1}
              maxValue={dumbbellUserMax}
              isInTopBracket={isInTopBracket}
            />
            <Dumbbell
              label={user.name2}
              dot1Percent={user.value2}
              dot2Percent={user.top2}
              line1Percent={user.average2}
              percentMultiplier={1}
              maxValue={dumbbellUserMax}
              isInTopBracket={isInTopBracket}
            />
            <Dumbbell
              label={user.name3}
              dot1Percent={user.value3}
              dot2Percent={user.top3}
              line1Percent={user.average3}
              percentMultiplier={1}
              maxValue={dumbbellUserMax}
              isInTopBracket={isInTopBracket}
            />
            <Dumbbell
              label={user.name4}
              dot1Percent={user.value4}
              dot2Percent={user.top4}
              line1Percent={user.average4}
              percentMultiplier={1}
              maxValue={dumbbellUserMax}
              isInTopBracket={isInTopBracket}
            />
            <Dumbbell
              label={user.name5}
              dot1Percent={user.value5}
              dot2Percent={user.top5}
              line1Percent={user.average5}
              percentMultiplier={1}
              maxValue={dumbbellUserMax}
              isInTopBracket={isInTopBracket}
            />
          </DumbbellUser>
        )}

        {/* 
          If user is in top beacket we want to show something different 
          And if no bracket set, just hide 
        */}
        {this.state.currentBracketNumber === 13 && this.state.hasSetBracket && (
          <DumbbellUser>
            <p className={styles.paragraphText}>
              Now, let's look at the five most common jobs for people earning
              the least. Only <strong>2 per cent</strong> of people in those
              jobs make it into the top earners group.
            </p>
            <Dumbbell
              label="Sales Assistants and Salespersons"
              dot1Percent={1.34}
              dot1Label="Your bracket"
              dot2Percent={12.29}
              dot2Label="Bottom bracket"
              dot2Color="#607477"
              dot2TextColor="#607477"
              dot2LabelColor="#607477"
              line1Percent={4.19}
              line1Label="Avg. of all brackets"
              percentMultiplier={1}
              maxValue={13}
              isInTopBracket={isInTopBracket}
            />
            <Dumbbell
              label="Food Preparation Assistants"
              dot1Percent={0.04}
              dot2Percent={4.9}
              dot2Color="#607477"
              dot2TextColor="#607477"
              dot2LabelColor="#607477"
              line1Percent={0.94}
              percentMultiplier={1}
              maxValue={13}
              isInTopBracket={isInTopBracket}
            />
            <Dumbbell
              label="Hospitality Workers"
              dot1Percent={0.08}
              dot2Percent={4.5}
              dot2Color="#607477"
              dot2TextColor="#607477"
              dot2LabelColor="#607477"
              line1Percent={1.56}
              percentMultiplier={1}
              maxValue={13}
              isInTopBracket={isInTopBracket}
            />
            <Dumbbell
              label="Checkout Operators and Office Cashiers"
              dot1Percent={0.02}
              dot2Percent={3.42}
              dot2Color="#607477"
              dot2TextColor="#607477"
              dot2LabelColor="#607477"
              line1Percent={0.64}
              percentMultiplier={1}
              maxValue={13}
              isInTopBracket={isInTopBracket}
            />
            <Dumbbell
              label="Sports and Fitness Workers"
              dot1Percent={0.23}
              dot2Percent={1.86}
              dot2Color="#607477"
              dot2TextColor="#607477"
              dot2LabelColor="#607477"
              line1Percent={0.48}
              percentMultiplier={1}
              maxValue={13}
              isInTopBracket={isInTopBracket}
            />
          </DumbbellUser>
        )}

        {/* 
          Smaller dumbbell charts
        */}
        <DumbbellEducation>
          <Dumbbell
            label="Bachelor degrees"
            dot1Percent={this.state.hasSetBracket ? user.bachelor : false}
            dot1Label={this.state.hasSetBracket ? "Your bracket" : false}
            dot2Percent={isInTopBracket ? 11.73 : 61.79}
            dot2Label={isInTopBracket ? "Bottom bracket" : "Top bracket"}
            dot2Color={isInTopBracket ? "#607477" : undefined}
            dot2TextColor={isInTopBracket ? "#607477" : undefined}
            dot2LabelColor={isInTopBracket ? "#607477" : undefined}
            line1Percent={24.88}
            line1Label="Avg. of all brackets"
            percentMultiplier={1}
            maxValue={100}
            isInTopBracket={isInTopBracket}
          />
        </DumbbellEducation>

        <DumbbellGender>
          <Dumbbell
            label="Males"
            dot1Percent={this.state.hasSetBracket ? user.male : false}
            dot1Label={this.state.hasSetBracket ? "Your bracket" : false}
            dot2Percent={isInTopBracket ? 38.53 : 75.17}
            dot2Label={isInTopBracket ? "Bottom bracket" : "Top bracket"}
            dot2Color={isInTopBracket ? "#607477" : undefined}
            dot2TextColor={isInTopBracket ? "#607477" : undefined}
            dot2LabelColor={isInTopBracket ? "#607477" : undefined}
            line1Percent={49.64}
            line1Label="Avg. of all brackets"
            percentMultiplier={1}
            maxValue={100}
            isInTopBracket={isInTopBracket}
          />
        </DumbbellGender>
        <DumbbellIndigenous>
          <Dumbbell
            label="Indigenous population"
            dot1Percent={this.state.hasSetBracket ? user.indigenous : false}
            dot1Label={this.state.hasSetBracket ? "Your bracket" : false}
            dot2Percent={isInTopBracket ? 3.02 : 0.82}
            dot2Label={isInTopBracket ? "Bottom bracket" : "Top bracket"}
            dot2Color={isInTopBracket ? "#607477" : undefined}
            dot2TextColor={isInTopBracket ? "#607477" : undefined}
            dot2LabelColor={isInTopBracket ? "#607477" : undefined}
            dot2Align={this.state.hasSetBracket ? undefined : "left"}
            line1Percent={2.05}
            line1Label="Avg. of all brackets"
            percentMultiplier={1}
            maxValue={10}
            isInTopBracket={isInTopBracket}
          />
        </DumbbellIndigenous>
        <DumbbellBorn>
          <Dumbbell
            label="Born in Australia"
            dot1Percent={this.state.hasSetBracket ? user.born : false}
            dot1Label={this.state.hasSetBracket ? "Your bracket" : false}
            dot2Percent={isInTopBracket ? 72.24 : 65.68}
            dot2Label={isInTopBracket ? "Bottom bracket" : "Top bracket"}
            dot2Color={isInTopBracket ? "#607477" : undefined}
            dot2TextColor={isInTopBracket ? "#607477" : undefined}
            dot2LabelColor={isInTopBracket ? "#607477" : undefined}
            dot2Align={this.state.hasSetBracket ? undefined : "left"}
            line1Percent={67}
            line1Label="Avg. of all brackets"
            percentMultiplier={1}
            maxValue={100}
            isInTopBracket={isInTopBracket}
          />
        </DumbbellBorn>
        <DumbbellVoluntary>
          <Dumbbell
            label="Voluntary work"
            dot1Percent={this.state.hasSetBracket ? user.voluntary : false}
            dot1Label={this.state.hasSetBracket ? "Your bracket" : false}
            dot2Percent={isInTopBracket ? 26.14 : 29.09}
            dot2Label={isInTopBracket ? "Bottom bracket" : "Top bracket"}
            dot2Color={isInTopBracket ? "#607477" : undefined}
            dot2TextColor={isInTopBracket ? "#607477" : undefined}
            dot2LabelColor={isInTopBracket ? "#607477" : undefined}
            line1Percent={20.76}
            line1Label="Avg. of all brackets"
            percentMultiplier={1}
            maxValue={100}
            isInTopBracket={isInTopBracket}
          />
        </DumbbellVoluntary>
        <DumbbellCar>
          <Dumbbell
            label="Owns one or two cars"
            dot1Percent={this.state.hasSetBracket ? user.car1or2 : false}
            dot1Label={this.state.hasSetBracket ? "Your bracket" : false}
            dot2Percent={isInTopBracket ? 58.0 : 66.21}
            dot2Label={isInTopBracket ? "Bottom bracket" : "Top bracket"}
            dot2Color={isInTopBracket ? "#607477" : undefined}
            dot2TextColor={isInTopBracket ? "#607477" : undefined}
            dot2LabelColor={isInTopBracket ? "#607477" : undefined}
            line1Percent={64.18}
            percentMultiplier={1}
            line1Label="Avg. of all brackets"
            maxValue={100}
            isInTopBracket={isInTopBracket}
          />
          <Dumbbell
            label="Owns three or more cars"
            dot1Percent={this.state.hasSetBracket ? user.car3ormore : false}
            dot2Percent={isInTopBracket ? 33.16 : 24.04}
            dot2Color={isInTopBracket ? "#607477" : undefined}
            dot2TextColor={isInTopBracket ? "#607477" : undefined}
            dot2LabelColor={isInTopBracket ? "#607477" : undefined}
            dot2Align={this.state.hasSetBracket ? undefined : "left"}
            line1Percent={25.51}
            percentMultiplier={1}
            maxValue={100}
            isInTopBracket={isInTopBracket}
          />
        </DumbbellCar>
        <DumbbellMarriage>
          <Dumbbell
            label="Married"
            dot1Percent={this.state.hasSetBracket ? user.married : false}
            dot1Label={this.state.hasSetBracket ? "Your bracket" : false}
            dot2Percent={isInTopBracket ? 33.75 : 72.86}
            dot2Label={isInTopBracket ? "Bottom bracket" : "Top bracket"}
            dot2Color={isInTopBracket ? "#607477" : undefined}
            dot2TextColor={isInTopBracket ? "#607477" : undefined}
            dot2LabelColor={isInTopBracket ? "#607477" : undefined}
            line1Percent={49.92}
            percentMultiplier={1}
            line1Label="Avg. of all brackets"
            maxValue={100}
            isInTopBracket={isInTopBracket}
          />
          <Dumbbell
            label="Never married"
            dot1Percent={this.state.hasSetBracket ? user.nevermarried : false}
            dot2Percent={isInTopBracket ? 60.37 : 15.21}
            dot2Color={isInTopBracket ? "#607477" : undefined}
            dot2TextColor={isInTopBracket ? "#607477" : undefined}
            dot2LabelColor={isInTopBracket ? "#607477" : undefined}
            dot2Align={this.state.hasSetBracket ? undefined : "left"}
            line1Percent={32.57}
            percentMultiplier={1}
            maxValue={100}
            isInTopBracket={isInTopBracket}
          />
          <Dumbbell
            label="Divorced"
            dot1Percent={this.state.hasSetBracket ? user.divorced : false}
            dot2Percent={isInTopBracket ? 3.0 : 7.26}
            dot2Color={isInTopBracket ? "#607477" : undefined}
            dot2TextColor={isInTopBracket ? "#607477" : undefined}
            dot2LabelColor={isInTopBracket ? "#607477" : undefined}
            dot2Align={this.state.hasSetBracket ? undefined : "left"}
            line1Percent={9.05}
            percentMultiplier={1}
            maxValue={100}
            isInTopBracket={isInTopBracket}
          />
        </DumbbellMarriage>

        <DumbbellContMarriage>
          <Dumbbell
            label="Married (control)"
            dot1Percent={this.state.hasSetBracket ? user.contmarried : false}
            dot1Label={this.state.hasSetBracket ? "Your bracket" : false}
            dot2Percent={isInTopBracket ? 59.65 : 61.57}
            dot2Label={isInTopBracket ? "Bottom bracket" : "Top bracket"}
            dot2Color={isInTopBracket ? "#607477" : undefined}
            dot2TextColor={isInTopBracket ? "#607477" : undefined}
            dot2LabelColor={isInTopBracket ? "#607477" : undefined}
            line1Percent={50.84}
            line1Label="Avg. of all brackets"
            percentMultiplier={1}
            maxValue={100}
            isInTopBracket={isInTopBracket}
          />
          <Dumbbell
            label="Never married (control)"
            dot1Percent={
              this.state.hasSetBracket ? user.contnevermarried : false
            }
            dot2Percent={isInTopBracket ? 29.7 : 26.06}
            dot2Color={isInTopBracket ? "#607477" : undefined}
            dot2TextColor={isInTopBracket ? "#607477" : undefined}
            dot2LabelColor={isInTopBracket ? "#607477" : undefined}
            dot2Align={this.state.hasSetBracket ? undefined : "left"}
            line1Percent={31.53}
            percentMultiplier={1}
            maxValue={100}
            isInTopBracket={isInTopBracket}
          />
          <Dumbbell
            label="Divorced (control)"
            dot1Percent={this.state.hasSetBracket ? user.contdivorced : false}
            dot2Percent={isInTopBracket ? 5.21 : 6.23}
            dot2Color={isInTopBracket ? "#607477" : undefined}
            dot2TextColor={isInTopBracket ? "#607477" : undefined}
            dot2LabelColor={isInTopBracket ? "#607477" : undefined}
            dot2Align={this.state.hasSetBracket ? undefined : "left"}
            line1Percent={9.19}
            percentMultiplier={1}
            maxValue={100}
            isInTopBracket={isInTopBracket}
          />
        </DumbbellContMarriage>
      </div>
    );
  }
}

function getLgaTop(lgaData, lgaCode) {
  return lgaData.find(lga => +lga.LGA_CODE_2016 === lgaCode); // Pollyfilled in MapScroller.js
}

module.exports = App;
