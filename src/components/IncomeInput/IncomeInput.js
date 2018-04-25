/**
 * IncomeInput is a component that calculates a persons's income bracket
 * and uses a slider to compare income brackets.
 */
const React = require("react");
const styles = require("./IncomeInput.scss");
const ReactDOM = require("react-dom");
const Portal = require("react-portal");
const noUiSlider = require("nouislider");
const wNumb = require("wnumb");

const FromLocaleString = require("../../lib/fromlocalestring");
const fromLocaleString = new FromLocaleString();

// Set up some constants
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
      income: 800,
      infoIsSet: false,
      narrativeState: "initial", // locked, calculate, result
      incomeBracket: 8,
      sliderGuess: 50,
      guessBracket: 6,
      guessMessage: "Nice try..."
    };
  }

  // Fires on keypress when in the income input
  handleIncomeChange(event) {
    let income = fromLocaleString.number(event.target.value);
    if (isNaN(income)) return;

    this.setState({
      income: income,
      incomeBracket: whatIncomeBracketNet(income)
    });
  }

  lockIn() {
    this.setState({ narrativeState: "locked" });
  }

  splitUpBar() {
    // Don't split bar if already trying again
    if (this.state.narrativeState !== "result") return;

    this.spaces = document.getElementsByClassName(styles.barSpacer);

    // Fade in the spaces
    for (var i = 0; i < this.spaces.length; i++) {
      this.spaces[i].style.opacity = "1";
      this.spaces[i].style.height = "4px";
    }

    // Grow the slider
    this.slider.style.height = "374px";
  }

  // Result is already calculated technically, but the user doesn't know that
  calculateResult(event) {
    if (event) event.preventDefault();

    // Show calculating state
    this.setState({ narrativeState: "calculate" });

    // Wait a while then show result
    setTimeout(this.showResult.bind(this), 500);
  }

  showResult() {
    let difference = getDifference(
      this.state.incomeBracket,
      this.state.guessBracket
    );

    this.setState({ guessMessage: getGuessMessageAboveOrBelow(difference) });

    let incomeBracketNumber = whatIncomeBracket(this.state.income);
    let guessBracketNumber = this.state.guessBracket;

    this.results = this.bracketInfo[incomeBracketNumber - 1];
    this.guessResults = this.bracketInfo[guessBracketNumber - 1];

    this.setState({ narrativeState: "result" });

    setTimeout(this.splitUpBar.bind(this), 200);
  }

  tryAgain(event) {
    this.setState({ infoIsSet: false });
    this.setState({ narrativeState: "initial" });
    this.slider.style.height = "326px";

    for (var i = 0; i < this.spaces.length; i++) {
      this.spaces[i].style.opacity = "0";
      this.spaces[i].style.height = "0px";
    }
  }

  attachSlider() {
    this.slider = document.getElementById("range");

    this.slider.style.height = "326px";
    this.slider.style.margin = "0 auto";
    this.slider.style.transition = "height 0.5s";

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

    // Event fires when slider is set
    this.slider.noUiSlider.on("set", () => {
      let sliderValue = this.slider.noUiSlider.get();

      this.setState({ sliderGuess: sliderValue });
      this.setState({ guessBracket: whatIncomeBracketPercent(sliderValue) });

      // Get user feedback message when slider changed
      let difference = getDifference(
        this.state.incomeBracket,
        this.state.guessBracket
      );

      this.setState({ guessMessage: getGuessMessageAboveOrBelow(difference) });
    });
  }

  componentDidMount() {
    this.attachSlider();
  }

  componentDidUpdate() {
    // Hide slider handles
    const tooltipEl = document.querySelector(".noUi-tooltip");
    const handleEl = document.querySelector(".noUi-handle");

    if (this.state.narrativeState === "result") {
      tooltipEl.style.visibility = "hidden";
      handleEl.style.visibility = "hidden";
    } else {
      tooltipEl.style.visibility = "visible";
      handleEl.style.visibility = "visible";
    }

    // Set up the fade-ins
    const fadeInEl = document.querySelectorAll("." + styles.opacityTransition);

    if (fadeInEl[0]) {
      setTimeout(() => {
        for (let i = 0; i < fadeInEl.length; i++) {
          addClass(fadeInEl[i], styles.opacityFull);
        }
      }, 1); // Wait a little while or else the transition don't work
    }
  }

  render() {
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
              <div className={styles.push4} /> {/* Just a spacer */}
              <div className={styles.opacityTransition}>
                <div className={styles.boldtext}>
                  What's your weekly take-home pay?:<br />
                  <form onSubmit={this.calculateResult.bind(this)}>
                    <label />
                    $&nbsp;{" "}
                    <input
                      onChange={this.handleIncomeChange.bind(this)}
                      type="text"
                      value={Number(this.state.income).toLocaleString("en", {
                        useGrouping: true
                      })}
                    />
                    &nbsp;&nbsp; per week
                  </form>
                </div>
                <div className={styles.smalltext}>Enter your weekly income</div>{" "}
                <button onClick={this.calculateResult.bind(this)}>
                  Show me where I sit
                </button>
              </div>
            </div>
          )}

          {this.state.narrativeState === "calculate" && (
            <div className={styles.column + " " + styles.one}>
              <div
                className={
                  styles.calculatingResult + " " + styles.opacityTransition
                }
              >
                <div></div>
              </div>
            </div>
          )}

          {this.state.narrativeState === "result" && (
            <div className={styles.column + " " + styles.one}>
              <div className={styles.opacityTransition}>
                <div
                  className={styles.standardText + " " + styles.guessMessage}
                >
                  {/* Not even close! or Spot on! etc */}
                  {this.state.guessMessage}
                </div>
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
            </div>
          )}

          <div className={styles.column + " " + styles.two}>
            <div className={styles.resultContainer}>
              {this.state.narrativeState === "result" ? (
                <div className={styles.scaleLabels}>
                  {this.results.percentAbove}% are richer
                </div>
              ) : (
                <div className={styles.scaleLabels}>Richest</div>
              )}

              <div className={styles.bracketContainer}>
                <div
                  className={
                    styles.resultBracket +
                    " " +
                    styles.bracket13 +
                    " " +
                    (this.state.incomeBracket === 13 && styles.bracketYours) +
                    " " +
                    (this.state.guessBracket === 13 && styles.bracketGuess) +
                    " " +
                    (this.state.narrativeState === "result"
                      ? styles.opacityFull
                      : styles.opacityNone)
                  }
                />
                <div
                  className={
                    styles.resultBracket +
                    " " +
                    styles.bracket12 +
                    " " +
                    (this.state.incomeBracket === 12 && styles.bracketYours) +
                    " " +
                    (this.state.guessBracket === 12 && styles.bracketGuess) +
                    " " +
                    (this.state.narrativeState === "result"
                      ? styles.opacityFull
                      : styles.opacityNone)
                  }
                />
                <div
                  className={
                    styles.resultBracket +
                    " " +
                    styles.bracket11 +
                    " " +
                    (this.state.incomeBracket === 11 && styles.bracketYours) +
                    " " +
                    (this.state.guessBracket === 11 && styles.bracketGuess) +
                    " " +
                    (this.state.narrativeState === "result"
                      ? styles.opacityFull
                      : styles.opacityNone)
                  }
                />
                <div
                  className={
                    styles.resultBracket +
                    " " +
                    styles.bracket10 +
                    " " +
                    (this.state.incomeBracket === 10 && styles.bracketYours) +
                    " " +
                    (this.state.guessBracket === 10 && styles.bracketGuess) +
                    " " +
                    (this.state.narrativeState === "result"
                      ? styles.opacityFull
                      : styles.opacityNone)
                  }
                />
                <div
                  className={
                    styles.resultBracket +
                    " " +
                    styles.bracket9 +
                    " " +
                    (this.state.incomeBracket === 9 && styles.bracketYours) +
                    " " +
                    (this.state.guessBracket === 9 && styles.bracketGuess) +
                    " " +
                    (this.state.narrativeState === "result"
                      ? styles.opacityFull
                      : styles.opacityNone)
                  }
                />
                <div
                  className={
                    styles.resultBracket +
                    " " +
                    styles.bracket8 +
                    " " +
                    (this.state.incomeBracket === 8 && styles.bracketYours) +
                    " " +
                    (this.state.guessBracket === 8 && styles.bracketGuess) +
                    " " +
                    (this.state.narrativeState === "result"
                      ? styles.opacityFull
                      : styles.opacityNone)
                  }
                />
                <div
                  className={
                    styles.resultBracket +
                    " " +
                    styles.bracket7 +
                    " " +
                    (this.state.incomeBracket === 7 && styles.bracketYours) +
                    " " +
                    (this.state.guessBracket === 7 && styles.bracketGuess) +
                    " " +
                    (this.state.narrativeState === "result"
                      ? styles.opacityFull
                      : styles.opacityNone)
                  }
                />
                <div
                  className={
                    styles.resultBracket +
                    " " +
                    styles.bracket6 +
                    " " +
                    (this.state.incomeBracket === 6 && styles.bracketYours) +
                    " " +
                    (this.state.guessBracket === 6 && styles.bracketGuess) +
                    " " +
                    (this.state.narrativeState === "result"
                      ? styles.opacityFull
                      : styles.opacityNone)
                  }
                />
                <div
                  className={
                    styles.resultBracket +
                    " " +
                    styles.bracket5 +
                    " " +
                    (this.state.incomeBracket === 5 && styles.bracketYours) +
                    " " +
                    (this.state.guessBracket === 5 && styles.bracketGuess) +
                    " " +
                    (this.state.narrativeState === "result"
                      ? styles.opacityFull
                      : styles.opacityNone)
                  }
                />
                <div
                  className={
                    styles.resultBracket +
                    " " +
                    styles.bracket4 +
                    " " +
                    (this.state.incomeBracket === 4 && styles.bracketYours) +
                    " " +
                    (this.state.guessBracket === 4 && styles.bracketGuess) +
                    " " +
                    (this.state.narrativeState === "result"
                      ? styles.opacityFull
                      : styles.opacityNone)
                  }
                />
                <div
                  className={
                    styles.resultBracket +
                    " " +
                    styles.bracket3 +
                    " " +
                    (this.state.incomeBracket === 3 && styles.bracketYours) +
                    " " +
                    (this.state.guessBracket === 3 && styles.bracketGuess) +
                    " " +
                    (this.state.narrativeState === "result"
                      ? styles.opacityFull
                      : styles.opacityNone)
                  }
                />
                <div
                  className={
                    styles.resultBracket +
                    " " +
                    styles.bracket2 +
                    " " +
                    (this.state.incomeBracket === 2 && styles.bracketYours) +
                    " " +
                    (this.state.guessBracket === 2 && styles.bracketGuess) +
                    " " +
                    (this.state.narrativeState === "result"
                      ? styles.opacityFull
                      : styles.opacityNone)
                  }
                />
                <div
                  className={
                    styles.resultBracket +
                    " " +
                    styles.bracket1 +
                    " " +
                    (this.state.incomeBracket === 1 && styles.bracketYours) +
                    " " +
                    (this.state.guessBracket === 1 && styles.bracketGuess) +
                    " " +
                    (this.state.narrativeState === "result"
                      ? styles.opacityFull
                      : styles.opacityNone)
                  }
                />
                {/* ----------------------------------------------------------------


                NEXT SECTION YOUR BRACKET


                ----------------------------------------------------------------*/}
                <div
                  className={
                    styles.resultBracketText +
                    " " +
                    styles.resultBracketText13 +
                    " " +
                    (this.state.incomeBracket === 13 &&
                    this.state.narrativeState === "result"
                      ? styles.opacityFull
                      : styles.opacityNone)
                  }
                >
                  Your<br />bracket
                </div>
                <div
                  className={
                    styles.resultBracketText +
                    " " +
                    styles.resultBracketText12 +
                    " " +
                    (this.state.incomeBracket === 12 &&
                    this.state.narrativeState === "result"
                      ? styles.opacityFull
                      : styles.opacityNone)
                  }
                >
                  Your<br />bracket
                </div>
                <div
                  className={
                    styles.resultBracketText +
                    " " +
                    styles.resultBracketText11 +
                    " " +
                    (this.state.incomeBracket === 11 &&
                    this.state.narrativeState === "result"
                      ? styles.opacityFull
                      : styles.opacityNone)
                  }
                >
                  Your<br />bracket
                </div>
                <div
                  className={
                    styles.resultBracketText +
                    " " +
                    styles.resultBracketText10 +
                    " " +
                    (this.state.incomeBracket === 10 &&
                    this.state.narrativeState === "result"
                      ? styles.opacityFull
                      : styles.opacityNone)
                  }
                >
                  Your<br />bracket
                </div>
                <div
                  className={
                    styles.resultBracketText +
                    " " +
                    styles.resultBracketText9 +
                    " " +
                    (this.state.incomeBracket === 9 &&
                    this.state.narrativeState === "result"
                      ? styles.opacityFull
                      : styles.opacityNone)
                  }
                >
                  Your<br />bracket
                </div>
                <div
                  className={
                    styles.resultBracketText +
                    " " +
                    styles.resultBracketText8 +
                    " " +
                    (this.state.incomeBracket === 8 &&
                    this.state.narrativeState === "result"
                      ? styles.opacityFull
                      : styles.opacityNone)
                  }
                >
                  Your<br />bracket
                </div>
                <div
                  className={
                    styles.resultBracketText +
                    " " +
                    styles.resultBracketText7 +
                    " " +
                    (this.state.incomeBracket === 7 &&
                    this.state.narrativeState === "result"
                      ? styles.opacityFull
                      : styles.opacityNone)
                  }
                >
                  Your<br />bracket
                </div>
                <div
                  className={
                    styles.resultBracketText +
                    " " +
                    styles.resultBracketText6 +
                    " " +
                    (this.state.incomeBracket === 6 &&
                    this.state.narrativeState === "result"
                      ? styles.opacityFull
                      : styles.opacityNone)
                  }
                >
                  Your<br />bracket
                </div>
                <div
                  className={
                    styles.resultBracketText +
                    " " +
                    styles.resultBracketText5 +
                    " " +
                    (this.state.incomeBracket === 5 &&
                    this.state.narrativeState === "result"
                      ? styles.opacityFull
                      : styles.opacityNone)
                  }
                >
                  Your<br />bracket
                </div>
                <div
                  className={
                    styles.resultBracketText +
                    " " +
                    styles.resultBracketText4 +
                    " " +
                    (this.state.incomeBracket === 4 &&
                    this.state.narrativeState === "result"
                      ? styles.opacityFull
                      : styles.opacityNone)
                  }
                >
                  Your<br />bracket
                </div>
                <div
                  className={
                    styles.resultBracketText +
                    " " +
                    styles.resultBracketText3 +
                    " " +
                    (this.state.incomeBracket === 3 &&
                    this.state.narrativeState === "result"
                      ? styles.opacityFull
                      : styles.opacityNone)
                  }
                >
                  Your<br />bracket
                </div>
                <div
                  className={
                    styles.resultBracketText +
                    " " +
                    styles.resultBracketText2 +
                    " " +
                    (this.state.incomeBracket === 2 &&
                    this.state.narrativeState === "result"
                      ? styles.opacityFull
                      : styles.opacityNone)
                  }
                >
                  Your<br />bracket
                </div>
                <div
                  className={
                    styles.resultBracketText +
                    " " +
                    styles.resultBracketText1 +
                    " " +
                    (this.state.incomeBracket === 1 &&
                    this.state.narrativeState === "result"
                      ? styles.opacityFull
                      : styles.opacityNone)
                  }
                >
                  Your<br />bracket
                </div>

                {/*########################################################################
                ANOTHER SECTION GUESS 
                ########################################################################*/}

                <div
                  className={
                    styles.resultGuessText +
                    " " +
                    styles.resultGuessText13 +
                    " " +
                    (this.state.guessBracket === 13 &&
                    this.state.narrativeState === "result"
                      ? styles.opacityFull
                      : styles.opacityNone)
                  }
                >
                  Your<br />guess
                </div>
                <div
                  className={
                    styles.resultGuessText +
                    " " +
                    styles.resultGuessText12 +
                    " " +
                    (this.state.guessBracket === 12 &&
                    this.state.narrativeState === "result"
                      ? styles.opacityFull
                      : styles.opacityNone)
                  }
                >
                  Your<br />guess
                </div>
                <div
                  className={
                    styles.resultGuessText +
                    " " +
                    styles.resultGuessText11 +
                    " " +
                    (this.state.guessBracket === 11 &&
                    this.state.narrativeState === "result"
                      ? styles.opacityFull
                      : styles.opacityNone)
                  }
                >
                  Your<br />guess
                </div>
                <div
                  className={
                    styles.resultGuessText +
                    " " +
                    styles.resultGuessText10 +
                    " " +
                    (this.state.guessBracket === 10 &&
                    this.state.narrativeState === "result"
                      ? styles.opacityFull
                      : styles.opacityNone)
                  }
                >
                  Your<br />guess
                </div>
                <div
                  className={
                    styles.resultGuessText +
                    " " +
                    styles.resultGuessText9 +
                    " " +
                    (this.state.guessBracket === 9 &&
                    this.state.narrativeState === "result"
                      ? styles.opacityFull
                      : styles.opacityNone)
                  }
                >
                  Your<br />guess
                </div>
                <div
                  className={
                    styles.resultGuessText +
                    " " +
                    styles.resultGuessText8 +
                    " " +
                    (this.state.guessBracket === 8 &&
                    this.state.narrativeState === "result"
                      ? styles.opacityFull
                      : styles.opacityNone)
                  }
                >
                  Your<br />guess
                </div>
                <div
                  className={
                    styles.resultGuessText +
                    " " +
                    styles.resultGuessText7 +
                    " " +
                    (this.state.guessBracket === 7 &&
                    this.state.narrativeState === "result"
                      ? styles.opacityFull
                      : styles.opacityNone)
                  }
                >
                  Your<br />guess
                </div>
                <div
                  className={
                    styles.resultGuessText +
                    " " +
                    styles.resultGuessText6 +
                    " " +
                    (this.state.guessBracket === 6 &&
                    this.state.narrativeState === "result"
                      ? styles.opacityFull
                      : styles.opacityNone)
                  }
                >
                  Your<br />guess
                </div>
                <div
                  className={
                    styles.resultGuessText +
                    " " +
                    styles.resultGuessText5 +
                    " " +
                    (this.state.guessBracket === 5 &&
                    this.state.narrativeState === "result"
                      ? styles.opacityFull
                      : styles.opacityNone)
                  }
                >
                  Your<br />guess
                </div>
                <div
                  className={
                    styles.resultGuessText +
                    " " +
                    styles.resultGuessText4 +
                    " " +
                    (this.state.guessBracket === 4 &&
                    this.state.narrativeState === "result"
                      ? styles.opacityFull
                      : styles.opacityNone)
                  }
                >
                  Your<br />guess
                </div>
                <div
                  className={
                    styles.resultGuessText +
                    " " +
                    styles.resultGuessText3 +
                    " " +
                    (this.state.guessBracket === 3 &&
                    this.state.narrativeState === "result"
                      ? styles.opacityFull
                      : styles.opacityNone)
                  }
                >
                  Your<br />guess
                </div>
                <div
                  className={
                    styles.resultGuessText +
                    " " +
                    styles.resultGuessText2 +
                    " " +
                    (this.state.guessBracket === 2 &&
                    this.state.narrativeState === "result"
                      ? styles.opacityFull
                      : styles.opacityNone)
                  }
                >
                  Your<br />guess
                </div>
                <div
                  className={
                    styles.resultGuessText +
                    " " +
                    styles.resultGuessText1 +
                    " " +
                    (this.state.guessBracket === 1 &&
                    this.state.narrativeState === "result"
                      ? styles.opacityFull
                      : styles.opacityNone)
                  }
                >
                  Your<br />guess
                </div>

                <div className={styles.barSpacer + " " + styles.space1} />
                <div className={styles.barSpacer + " " + styles.space2} />
                <div className={styles.barSpacer + " " + styles.space3} />
                <div className={styles.barSpacer + " " + styles.space4} />
                <div className={styles.barSpacer + " " + styles.space5} />
                <div className={styles.barSpacer + " " + styles.space6} />
                <div className={styles.barSpacer + " " + styles.space7} />
                <div className={styles.barSpacer + " " + styles.space8} />
                <div className={styles.barSpacer + " " + styles.space9} />
                <div className={styles.barSpacer + " " + styles.space10} />
                <div className={styles.barSpacer + " " + styles.space11} />
                <div className={styles.barSpacer + " " + styles.space12} />

                <div id="range" />
              </div>

              {/* <div className={styles.bracketContainer}>
                
                <div id="range" />
              </div> */}

              {this.state.narrativeState === "result" ? (
                <div className={styles.scaleLabels}>
                  {this.results.percentBelow}% are poorer
                </div>
              ) : (
                <div className={styles.scaleLabels}>Poorest</div>
              )}
            </div>

            {/* Render results */}
            {this.state.narrativeState === "result" && <div />}
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

function whatIncomeBracketNet(incomeNetPerWeek) {
  if (incomeNetPerWeek >= 2128) return 13;
  else if (incomeNetPerWeek >= 1498) return 12;
  else if (incomeNetPerWeek >= 1340) return 11;
  else if (incomeNetPerWeek >= 1175) return 10;
  else if (incomeNetPerWeek >= 1006) return 9;
  else if (incomeNetPerWeek >= 837) return 8;
  else if (incomeNetPerWeek >= 702) return 7;
  else if (incomeNetPerWeek >= 593) return 6;
  else if (incomeNetPerWeek >= 471) return 5;
  else if (incomeNetPerWeek >= 390) return 4;
  else if (incomeNetPerWeek >= 300) return 3;
  else if (incomeNetPerWeek >= 150) return 2;
  else return 1;
}

function getGuessMessageAboveOrBelow(difference) {
  switch (difference) {
    case 12:
    case 11:
      return "Keep dreaming...";
    case 10:
    case 9:
      return "Way off...";
    case 8:
    case 7:
      return "You're reaching...";
    case 6:
    case 5:
      return "A bit of a stretch...";
    case 4:
    case 3:
    case 2:
      return "A few brackets over...";
    case 1:
      return "Just a little over...";
    case 0:
      return "Spot on!";
    case -1:
      return "Just a little under...";
    case -2:
      return "A few brackets under...";
    case -3:
    case -4:
    case -5:
    case -6:
      return "A moderate underestimation...";
    case -7:
    case -8:
      return "A large underestimation...";
    case -9:
    case -10:
      return "Way off...";
    case -11:
    case -12:
      return "Not even close...";
    default:
      return "Good try...";
  }
}

function getDifference(income, guess) {
  return guess - income;
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

// Helper random number
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

module.exports = IncomeInput;
