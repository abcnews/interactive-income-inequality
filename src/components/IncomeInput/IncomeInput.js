const React = require("react");
const styles = require("./IncomeInput.scss");
const ReactDOM = require("react-dom");
const Portal = require("react-portal");
const noUiSlider = require("nouislider");
const wNumb = require("wnumb");

const FromLocaleString = require("../../lib/fromlocalestring");
const fromLocaleString = new FromLocaleString();

// Set up some constants
const TRANSITION_TIME = 500;
const PUBLIC_URL_BASE =
  "http://www.abc.net.au/res/sites/news-projects/income-comparisons-react/master/";

class IncomeInput extends React.Component {
  constructor(props) {
    super(props);

    // Import some data
    this.bracketInfo = require("./IncomeInput.json").bracketInfo;

    this.results = {};
    this.guessResults = {};
    // Set initial state of component
    this.state = {
      income: "1200",
      infoIsSet: false,
      narrativeState: "initial",
      incomeBracket: 8,
      sliderGuess: 50,
      guessBracket: 6
    };
  }

  handleIncomeChange(event) {
    let income = fromLocaleString.number(event.target.value);
    console.log(fromLocaleString.number("13,000"));
    this.setState({ income: income });
  }

  lockIn() {
    this.setState({ narrativeState: "locked" });
  }

  showResult(event) {
    event.preventDefault();
    this.setState({ narrativeState: "result" });

    // const wrapperEl = document.querySelector("." + styles.wrapper);

    // // Fade out the wrapper element
    // addClass(wrapperEl, styles.fadeOut);

    // setTimeout(() => {
    //   // Wait for a while then do the calculation
    //   let incomeBracketNumber = whatIncomeBracket(this.state.income);
    //   let guessBracketNumber = this.state.guessBracket;

    //   this.results = this.bracketInfo[incomeBracketNumber - 1];
    //   this.guessResults = this.bracketInfo[guessBracketNumber - 1];

    //   this.setState({ infoIsSet: true });

    //   // Fade back in
    //   removeClass(wrapperEl, styles.fadeOut);
    //   addClass(wrapperEl, styles.fadeIn);

    //   setTimeout(() => {
    //     // Reset styles
    //     removeClass(wrapperEl, styles.fadeIn);
    //   }, TRANSITION_TIME);
    // }, TRANSITION_TIME);
  }

  tryAgain(event) {
    this.setState({ infoIsSet: false });
    this.setState({ narrativeState: "initial" });
  }

  componentDidMount() {
    this.slider = document.getElementById("range");

    this.slider.style.height = "100%";
    this.slider.style.margin = "0 auto";

    noUiSlider.create(this.slider, {
      start: [this.state.sliderGuess],
      direction: "rtl",
      tooltips: wNumb({ decimals: 0, suffix: "%" }),
      orientation: "vertical",
      range: {
        min: 0,
        max: 100
      }
    });

    this.slider.noUiSlider.on("set", () => {
      let sliderValue = this.slider.noUiSlider.get();
      console.log(whatIncomeBracketPercent(sliderValue));
      console.log(sliderValue);
      this.setState({ sliderGuess: sliderValue });
      this.setState({ guessBracket: whatIncomeBracketPercent(sliderValue) });
    });
  }

  componentDidUpdate() {
    if (!this.state.infoIsSet) {
      // Show the slider. Reset the interactive
      this.slider.style.display = "block";
    } else {
      // Remove the slider
      this.slider.style.display = "none";

      this.yourBracketEl = document.querySelector(
        "." + styles.scaleContainerResults
      );

      // Place element along the percentage
      this.yourBracketEl.style.top = `calc(${Number(
        this.results.percentAbove
      )}% + ${this.results.percent / 2}% - 113px)`;

      // Place the bracket box
      this.bracketBox = document.querySelector("." + styles.bracketBox);
      this.bracketBoxOuter = document.querySelector(
        "." + styles.bracketBoxOuter
      );

      this.bracketBox.style.top = `calc(${Number(this.results.percentAbove)}%)`;

      this.bracketBoxOuter.style.top = `calc(${Number(
        this.results.percentAbove
      )}% - 2px)`;

      this.bracketBox.style.height = this.results.percent + "%";
      this.bracketBoxOuter.style.height =
        "calc(" + this.results.percent + "% + 4px)";

      // Build the guess bracket box
      this.guessBox = document.querySelector("." + styles.guessBox);
      this.guessBoxOuter = document.querySelector("." + styles.guessBoxOuter);

      this.guessBox.style.top = `calc(${Number(
        this.guessResults.percentAbove
      )}%)`;

      this.guessBoxOuter.style.top = `calc(${Number(
        this.guessResults.percentAbove
      )}% - 2px)`;

      this.guessBox.style.height = this.guessResults.percent + "%";
      this.guessBoxOuter.style.height =
        "calc(" + this.guessResults.percent + "% + 4px)";

      // Unhide the block (dunno if this is necessary any more)
      this.resultsBar = document.getElementById("result");
      this.resultsBar.style.display = "block";
    }
  }

  render() {
    // Start conditional rendering
    // let infoIsSet = null;
    // if (this.state.infoIsSet) infoIsSet = true;
    // else infoIsSet = false;

    // let narrativeState = "";
    // if (this.state.narrativeState) narrativeState = this.state.narrativeState;
    // TODO: work out why we're doing it this way instead of just directly assigning value
    // or using the state directly

    // console.log(narrativeState);

    return ReactDOM.createPortal(
      <div className={styles.wrapper}>
        <div className={styles.flexWrapper}>
          {/* Choose whether to display the input or the output text etc. */}
          {this.state.narrativeState === "initial" && (
            <div className={styles.column + " " + styles.one}>
              <div className={styles.boldtext}>
                Where do you think your income bracket sits on the scale of
                least to most rich Australians?
              </div>
              <div className={styles.smalltext}>
                Use the slider on the right to estimate your position
              </div>

              <div className={styles.push4} />

              <button onClick={this.lockIn.bind(this)}>Lock it in</button>
            </div>
          )}

          {this.state.narrativeState === "locked" && (
            <div className={styles.column + " " + styles.one}>
              <div className={styles.boldtext}>
                Where do you think your income bracket sits on the scale of
                least to most rich Australians?
              </div>
              <div className={styles.smalltext}>
                Use the slider on the right to estimate your position
              </div>
              <div className={styles.push4} />
              <div className={styles.boldtext}>
                Your income before tax is<br />
                <form onSubmit={this.showResult.bind(this)}>
                  <label />
                  $&nbsp;{" "}
                  <input
                    onChange={this.handleIncomeChange.bind(this)}
                    type="text"
                    value={Number(this.state.income).toLocaleString('en', {useGrouping:true})}
                  />
                  
                  {// TODO: try comma grouping two way conversion
                    /* <input
                    onChange={this.handleIncomeChange.bind(this)}
                    type="text"
                    value={Number(this.state.income).toLocaleString('en', {useGrouping:true})}
                  /> */}
                  &nbsp;&nbsp; per week
                </form>
              </div>
              <div className={styles.smalltext}>Enter your weekly income</div>{" "}
              <button onClick={this.showResult.bind(this)}>
                Show me where I sit
              </button>
            </div>
          )}

          {this.state.narrativeState === "result" && (
            <div className={styles.column + " " + styles.one}>
              <div className={styles.standardText}>
                Your income puts you in the{" "}
                <span className={styles.resultsStandard}>
                  {this.results.text}
                </span>{" "}
                per annum income bracket for Australia, with{" "}
                <span className={styles.resultsStandard}>
                  {this.results.percent} per cent
                </span>{" "}
                of other income earners.
              </div>
              <div className={styles.standardText}>
                Above your bracket are{" "}
                <span className={styles.resultsAbove}>
                  {this.results.percentAbove} per cent
                </span>{" "}
                of income earners.
              </div>
              <div className={styles.standardText}>
                Below your bracket are{" "}
                <span className={styles.resultsBelow}>
                  {this.results.percentBelow} per cent
                </span>{" "}
                of income earners.
              </div>
              <button onClick={this.tryAgain.bind(this)}>
                <div className={styles.tryAgain}>
                  <span className={styles.reloadIcon}>
                    <img
                      src={PUBLIC_URL_BASE + "refresh.svg"}
                      width="20px"
                      height="20px"
                    />
                  </span>
                  <span>&nbsp;&nbsp;Try again</span>
                </div>
              </button>
            </div>
          )}

          <div className={styles.column + " " + styles.two}>
            {this.state.narrativeState && (
              <div className={styles.resultContainer}>
                <div id="range" />
              </div>
            )}

            {this.state.narrativeState === "this-will-never-fire" && (
              <div className={styles.resultContainer}>
                <div id="range" />
                <div id="result" className={styles.result}>
                  <div className={styles.verticalBar} />

                  <div className={styles.bracketBox} />
                  <div className={styles.bracketBoxOuter} />

                  <div className={styles.guessBox}>
                    <span>You said</span>
                  </div>
                  <div className={styles.guessBoxOuter} />
                </div>
              </div>
            )}
          </div>

          <div className={styles.column + " " + styles.three}>
            {/* {!this.state.infoIsSet && (
              <div className={styles.scaleContainer}>
                <div className={styles.mostRich}>
                  <div>
                    <img src={PUBLIC_URL_BASE + "ios-arrow-thin-up.svg"} />
                  </div>
                  <div className={styles.mostRichText}>
                    Most<br />rich
                  </div>
                </div>
                <div className={styles.leastRich}>
                  <div className={styles.leastRichText}>
                    Least<br />rich
                  </div>
                  <div>
                    <img src={PUBLIC_URL_BASE + "ios-arrow-thin-down.svg"} />
                  </div>
                </div>
              </div>
            )}

            {this.state.infoIsSet && (
              <div className={styles.scaleContainerResults}>
                <div className={styles.areRicher}>
                  <div>
                    <img src={PUBLIC_URL_BASE + "ios-arrow-thin-up.svg"} />
                  </div>
                  <div className={styles.areRicherText}>
                    <b>{Math.round(this.results.percentAbove)}%</b>
                    <br />are<br />richer
                  </div>
                </div>
                <div className={styles.yourBracket}>
                  Your<br />bracket
                </div>
                <div className={styles.arePoorer}>
                  <div className={styles.arePoorerText}>
                    <b>{Math.round(this.results.percentBelow)}%</b>
                    <br />are<br />poorer
                  </div>
                  <div>
                    <img src={PUBLIC_URL_BASE + "ios-arrow-thin-down.svg"} />
                  </div>
                </div>
              </div>
            )} */}
          </div>
        </div>
        <div />
      </div>,
      document.querySelector(".incomeinput")
    );
  }
}

// Helper functions for sorting income brackets
function whatIncomeBracket(incomePerWeek) {
  // Determine which income bracket a weekly income sits in
  let incomePerYear = incomePerWeek * 52;

  if (incomePerYear >= 156000) return 13;
  else if (incomePerYear >= 104000) return 12;
  else if (incomePerYear >= 91000) return 11;
  else if (incomePerYear >= 78000) return 10;
  else if (incomePerYear >= 65000) return 9;
  else if (incomePerYear >= 52000) return 8;
  else if (incomePerYear >= 41600) return 7;
  else if (incomePerYear >= 33800) return 6;
  else if (incomePerYear >= 26000) return 5;
  else if (incomePerYear >= 20800) return 4;
  else if (incomePerYear >= 15600) return 3;
  else if (incomePerYear >= 7800) return 2;
  else return 1;
}

function whatIncomeBracketPercent(percent) {
  if (percent >= 96.16) return 13;
  else if (percent >= 89.96) return 12;
  else if (percent >= 85.84) return 11;
  else if (percent >= 79.9) return 10;
  else if (percent >= 72.88) return 9;
  else if (percent >= 62.65) return 8;
  else if (percent >= 52.63) return 7;
  else if (percent >= 43.44) return 6;
  else if (percent >= 34.26) return 5;
  else if (percent >= 24.25) return 4;
  else if (percent >= 13.82) return 3;
  else if (percent >= 5.16) return 2;
  else return 1;
}

// Helper functions for className manipulation
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

module.exports = IncomeInput;
