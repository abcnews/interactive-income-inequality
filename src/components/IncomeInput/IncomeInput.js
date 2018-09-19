/**
 * IncomeInput is a component that calculates a persons's income bracket
 * and uses a slider to compare income brackets.
 */
const React = require("react");
const styles = require("./IncomeInput.scss");
const ReactDOM = require("react-dom");
const noUiSlider = require("nouislider");
const wNumb = require("wnumb");

const FeedbackForm = require("../FeedbackForm/FeedbackForm");

const FromLocaleString = require("../../lib/fromlocalestring");
const fromLocaleString = new FromLocaleString();

// Let devs specify a custom base URL
const fragmentData = document.querySelector("[data-income-comparisons-root]");

// Set up some constants
let PUBLIC_URL_BASE =
  "http://www.abc.net.au/res/sites/news-projects/income-comparisons-react/master/";

// Get baseURL from HTML Fragment
if (fragmentData && fragmentData.dataset.rootUrl)
  PUBLIC_URL_BASE = fragmentData.dataset.rootUrl;

class IncomeInput extends React.Component {
  constructor(props) {
    super(props);

    // Import some data
    this.bracketInfo = require("./IncomeInput.json").bracketInfo;

    this.results = {};
    this.guessResults = {};
    // Set initial state of component
    this.state = {
      income: 600,
      narrativeState: "initial", // locked, calculate, result
      incomeBracket: 6,
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

    // Fade out while "calculating" css transition fades
    const calculateFade = document.querySelector("." + styles.one);
    calculateFade.style.opacity = 0;

    // Update App data in parent component
    this.props.setCurrentBracket(this.state.incomeBracket);

    // Wait a while then show result
    setTimeout(this.showResult.bind(this), 1000);

    // Send some stats to Loggly
    // TODO: Uncomment below to collect stats
    // ABC.News.trackEvent({
    //   category: "News Lab Data",
    //   action:
    //     "{ income: " +
    //     this.state.income +
    //     ", incomeBracket: " +
    //     this.state.incomeBracket +
    //     ", sliderGuess: " +
    //     this.state.sliderGuess +
    //     ", guessBracket: " +
    //     this.state.guessBracket +
    //     "}",
    //   label: "Income Inequality: User income",
    //   value: 1
    // });
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
    this.setState({ narrativeState: "initial" });
    this.slider.style.height = "326px";

    for (var i = 0; i < this.spaces.length; i++) {
      this.spaces[i].style.opacity = "0";
      this.spaces[i].style.height = "0px";
    }
  }

  attachSlider() {
    this.slider = document.getElementById("range");

    // Try to tab index slider first

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
      },
      ariaFormat: {
        to: value => {
          return value !== undefined && Math.round(value) + " per cent";
        },
        from: Number
      }
    });

    const handle = document.getElementsByClassName("noUi-handle-lower")[0];

    // Keyboard changing of slider
    handle.addEventListener("keydown", e => {
      var value = Number(this.slider.noUiSlider.get());

      if (e.which === 40) {
        e.preventDefault();
        this.slider.noUiSlider.set(value - 5);
      }

      if (e.which === 38) {
        e.preventDefault();
        this.slider.noUiSlider.set(value + 5);
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
      <div>
        <div aria-live="polite" className={styles.wrapper}>
          <div className={styles.flexWrapper}>
            <div className={styles.column + " " + styles.two}>
              <div className={styles.resultContainer}>
                {this.state.narrativeState === "result" ? (
                  <div className={styles.scaleLabels}>
                    {Math.round(this.results.percentAbove)}% are richer
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
                    Your
                    <br />
                    bracket
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
                    Your
                    <br />
                    bracket
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
                    Your
                    <br />
                    bracket
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
                    Your
                    <br />
                    bracket
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
                    Your
                    <br />
                    bracket
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
                    Your
                    <br />
                    bracket
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
                    Your
                    <br />
                    bracket
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
                    Your
                    <br />
                    bracket
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
                    Your
                    <br />
                    bracket
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
                    Your
                    <br />
                    bracket
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
                    Your
                    <br />
                    bracket
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
                    Your
                    <br />
                    bracket
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
                    Your
                    <br />
                    bracket
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
                    Your
                    <br />
                    guess
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
                    Your
                    <br />
                    guess
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
                    Your
                    <br />
                    guess
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
                    Your
                    <br />
                    guess
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
                    Your
                    <br />
                    guess
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
                    Your
                    <br />
                    guess
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
                    Your
                    <br />
                    guess
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
                    Your
                    <br />
                    guess
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
                    Your
                    <br />
                    guess
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
                    Your
                    <br />
                    guess
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
                    Your
                    <br />
                    guess
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
                    Your
                    <br />
                    guess
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
                    Your
                    <br />
                    guess
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

                {this.state.narrativeState === "result" ? (
                  <div className={styles.scaleLabels}>
                    {Math.round(this.results.percentBelow)}% earn less
                  </div>
                ) : (
                  <div className={styles.scaleLabels}>Poorest</div>
                )}
              </div>

              {/* Render results */}
              {this.state.narrativeState === "result" && <div />}
            </div>
            {/* Choose whether to display the input or the output text etc. */}
            {this.state.narrativeState === "initial" && (
              <div className={styles.column + " " + styles.one}>
                <div className={styles.boldtext}>
                  Where do you think your income bracket sits on the scale of
                  least to most rich Australians?
                </div>
                <div className={styles.smalltext}>
                  Use the slider to estimate your position
                </div>

                <div className={styles.push4} />

                <button
                  className={styles.lockItIn}
                  onClick={this.lockIn.bind(this)}
                >
                  Lock it in
                </button>
              </div>
            )}

            {this.state.narrativeState === "locked" && (
              <div className={styles.column + " " + styles.one}>
                <div className={styles.boldtext}>
                  Where do you think your income bracket sits on the scale of
                  least to most rich Australians?
                </div>
                <div className={styles.smalltext}>
                  Use the slider to estimate your position
                </div>
                <div className={styles.push4} /> {/* Just a spacer */}
                <div className={styles.opacityTransition}>
                  <div id="takeHomePay" className={styles.boldtext}>
                    What's your weekly take-home pay?:
                    <br />
                    <form onSubmit={this.calculateResult.bind(this)}>
                      <label />
                      $&nbsp;{" "}
                      <input
                        labelledby="takeHomePay perweek"
                        onChange={this.handleIncomeChange.bind(this)}
                        type="text"
                        value={Number(this.state.income).toLocaleString("en", {
                          useGrouping: true
                        })}
                      />
                      &nbsp;&nbsp; <span id="perweek">per week</span>
                    </form>
                  </div>
                  <div className={styles.smalltext}>
                    Enter your weekly income
                  </div>{" "}
                  <button
                    className={styles.showMe}
                    onClick={this.calculateResult.bind(this)}
                  >
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
                  <div />
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
                  <button
                    className={styles.tryAgain}
                    onClick={this.tryAgain.bind(this)}
                  >
                    <div>
                      <span className={styles.reloadIcon}>
                        <img
                          src={PUBLIC_URL_BASE + "refresh.svg"}
                          width="20px"
                          height="20px"
                        />
                      </span>
                      <span className={styles.tryAgainText}>
                        &nbsp;&nbsp;Try again&nbsp;&nbsp;
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
          <div />
        </div>
        {this.state.narrativeState === "result" && (
          <div>
          <p className={styles.standardText}>
            How do you feel about the result?
          </p>
          <FeedbackForm />
          </div>
        )}
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
  const userMessages = [""];

  switch (difference) {
    case 12:
      return "Not even close...";
    case 11:
      return "Not even close...";
    case 10:
      return "Not even close...";
    case 9:
      return "Not even close...";
    case 8:
      return "Way off...";
    case 7:
      return "Way off...";
    case 6:
      return "Way off...";
    case 5:
      return "Nice try...";
    case 4:
      return "Nice try...";
    case 3:
      return "Nice try...";
    case 2:
      return "Close...";
    case 1:
      return "So close...";
    case 0:
      return "Spot on!";
    case -1:
      return "So close...";
    case -2:
      return "Close...";
    case -3:
      return "Nice try...";
    case -4:
      return "Nice try...";
    case -5:
      return "Nice try...";
    case -6:
      return "Way off...";
    case -7:
      return "Way off...";
    case -8:
      return "Way off...";
    case -9:
      return "Not even close...";
    case -10:
      return "Not even close...";
    case -11:
      return "Not even close...";
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

module.exports = IncomeInput;
