const React = require("react");
const styles = require("./IncomeInput.scss");
const ReactDOM = require("react-dom");
const Portal = require("react-portal");
const noUiSlider = require("nouislider");
const wNumb = require("wnumb");

// Set up some constants
const TRANSITION_TIME = 500;
const PUBLIC_URL_BASE =
  "http://www.abc.net.au/res/sites/news-projects/income-comparisons-react/master/";

class IncomeInput extends React.Component {
  constructor(props) {
    super(props);

    this.bracketInfo = [
      {
        text: "$1 - $7,799",
        percent: "5.16",
        percentBelow: "0.00",
        percentAbove: "94.84"
      },
      {
        text: "$7,800 - $15,599",
        percent: "8.66",
        percentBelow: "5.16",
        percentAbove: "86.18"
      },
      {
        text: "$15,600 - $20,799",
        percent: "10.43",
        percentBelow: "13.82",
        percentAbove: "75.75"
      },
      {
        text: "$20,800 - $25,999",
        percent: "10.01",
        percentBelow: "24.25",
        percentAbove: "65.74"
      },
      {
        text: "$26,000 - $33,799",
        percent: "9.18",
        percentBelow: "34.26",
        percentAbove: "56.56"
      },
      {
        text: "$33,800 - $41,599",
        percent: "9.19",
        percentBelow: "43.44",
        percentAbove: "47.37"
      },
      {
        text: "$41,600 - $51,999",
        percent: "10.02",
        percentBelow: "52.63",
        percentAbove: "37.35"
      },
      {
        text: "$52,000 - $64,999",
        percent: "10.23",
        percentBelow: "62.65",
        percentAbove: "27.12"
      },
      {
        text: "$65,000 - $77,999",
        percent: "7.02",
        percentBelow: "72.88",
        percentAbove: "20.10"
      },
      {
        text: "$78,000 - $90,999",
        percent: "5.94",
        percentBelow: "79.90",
        percentAbove: "14.16"
      },
      {
        text: "$91,000 - $103,999",
        percent: "4.12",
        percentBelow: "85.84",
        percentAbove: "10.04"
      },
      {
        text: "$104,000 - $155,999",
        percent: "6.20",
        percentBelow: "89.96",
        percentAbove: "3.84"
      },
      {
        text: "$156,000 or more",
        percent: "3.84",
        percentBelow: "96.16",
        percentAbove: "0.00"
      }
    ];
    this.results = {};
    this.guessResults = {};
    // Set initial state of component
    this.state = {
      income: "1200",
      infoIsSet: false,
      incomeBracket: 8,
      sliderGuess: 50,
      guessBracket: 7
    };
  }

  handleIncomeChange(event) {
    let income = event.target.value;
    this.setState({ income: income });
  }

  showMore(event) {
    event.preventDefault();
    const wrapperEl = document.querySelector("." + styles.wrapper);

    // Fade out the wrapper element
    addClass(wrapperEl, styles.fadeOut);

    setTimeout(() => {
      // Wait for a while then do the calculation
      let incomeBracketNumber = whatIncomeBracket(this.state.income);
      let guessBracketNumber = this.state.guessBracket;

      this.results = this.bracketInfo[incomeBracketNumber - 1];
      this.guessResults = this.bracketInfo[guessBracketNumber - 1];

      this.setState({ infoIsSet: true });

      // Fade back in
      removeClass(wrapperEl, styles.fadeOut);
      addClass(wrapperEl, styles.fadeIn);

      setTimeout(() => {
        // Reset styles
        removeClass(wrapperEl, styles.fadeIn);
      }, TRANSITION_TIME);
    }, TRANSITION_TIME);
  }

  tryAgain(event) {
    this.setState({ infoIsSet: false });
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
    let infoIsSet = null;
    if (this.state.infoIsSet) infoIsSet = true;
    else infoIsSet = false;
    return ReactDOM.createPortal(
      <div className={styles.wrapper}>
        <div className={styles.flexWrapper}>
          {/* Choose whether to display the input or the output text etc. */}
          {!infoIsSet ? (
            <div className={styles.column + " " + styles.one}>
              <div className={styles.boldtext}>
                Where do you think your income bracket sits on the scale of
                least to most rich Australians?
              </div>
              <div className={styles.smalltext}>
                Use the slider on the right to estimate your position
              </div>
              <div className={styles.boldtext}>
                Your income before tax is<br />
                <form onSubmit={this.showMore.bind(this)}>
                  <label />
                  $&nbsp;{" "}
                  <input
                    onChange={this.handleIncomeChange.bind(this)}
                    type="number"
                    value={this.state.income}
                  />
                  &nbsp;&nbsp; per week
                </form>
              </div>
              <div className={styles.smalltext}>Enter your weekly income</div>{" "}
              <button onClick={this.showMore.bind(this)}>
                Show me where I sit
              </button>
            </div>
          ) : (
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
                  <span>&nbsp;&nbsp; Try again</span>
                </div>
              </button>
            </div>
          )}
          {/******************** COLUMN TWO **********************/}
          <div className={styles.column + " " + styles.two}>
            {!infoIsSet ? (
              <div className={styles.resultContainer}>
                <div id="range" />
              </div>
            ) : (
              <div className={styles.resultContainer}>
                <div id="range" />
                <div id="result" className={styles.result}>
                  <div className={styles.verticalBar} />

                  <div className={styles.bracketBox} />
                  <div className={styles.bracketBoxOuter} />

                  <div className={styles.guessBox} />
                  <div className={styles.guessBoxOuter} />
                </div>
              </div>
            )}
          </div>
          <div className={styles.column + " " + styles.three}>
            {!infoIsSet ? (
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
            ) : (
              <div className={styles.scaleContainerResults}>
                <div className={styles.areRicher}>
                  <div>
                    <img src={PUBLIC_URL_BASE + "ios-arrow-thin-up.svg"} />
                  </div>
                  <div className={styles.areRicherText}>
                    <b>{this.results.percentAbove}%</b>
                    <br />are<br />richer
                  </div>
                </div>
                <div className={styles.yourBracket}>Your bracket</div>
                <div className={styles.arePoorer}>
                  <div className={styles.arePoorerText}>
                    <b>{this.results.percentBelow}%</b>
                    <br />are<br />poorer
                  </div>
                  <div>
                    <img src={PUBLIC_URL_BASE + "ios-arrow-thin-down.svg"} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div />
      </div>,
      document.querySelector(".incomeinput")
    );
  }
}

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
  else if (percent >= 79.90) return 10;
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
