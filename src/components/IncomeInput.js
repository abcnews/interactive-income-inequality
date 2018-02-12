const React = require("react");
const styles = require("./IncomeInput.scss");
const ReactDOM = require("react-dom");
const Portal = require("react-portal");
const noUiSlider = require("nouislider");
const wNumb = require("wnumb");

class IncomeInput extends React.Component {
  constructor(props) {
    super(props);
    this.state = { income: "", infoIsSet: false };
  }
  handleIncomeChange(event) {
    let income = event.target.value;
    this.setState({ income: income });
  }
  handleEstimationChange() {
    console.log("changed...");
  }
  showMore(event) {
    console.log(this.state.income);
    if (this.state.income > 1) {
      this.setState({ infoIsSet: true });
    }
  }
  componentDidMount() {
    var slider = document.getElementById("range");

    slider.style.height = "100%";
    slider.style.margin = "0 auto";

    noUiSlider.create(slider, {
      start: [50],
      direction: "rtl",
      tooltips: wNumb({ decimals: 0, suffix: "%" }),
      orientation: "vertical",
      range: {
        min: 0,
        max: 100
      }
    });

    slider.noUiSlider.on("set", () => {
      console.log("slider set");
      console.log(slider.noUiSlider.get());
    });
  }
  render() {
    let infoIsSet = null;
    if (this.state.infoIsSet) infoIsSet = true;
    else infoIsSet = false;
    return ReactDOM.createPortal(
      <div className={styles.wrapper}>
        <div className={styles.flexWrapper}>
          {infoIsSet ? (
            <div className={styles.column + " " + styles.one}>
              <div className={styles.standardText}>
                Your income puts you in the{" "}
                <span className={styles.resultsStandard}>
                  $52,000 - $64,999
                </span>{" "}
                per annum income bracket for Australia, with{" "}
                <span className={styles.resultsStandard}>10.23 per cent</span>{" "}
                of other income earners.
              </div>
              <div className={styles.standardText}>
                Above your bracket are <span className={styles.resultsAbove}>27.12 per cent</span> of income earners
              </div>
              <div className={styles.standardText}>
                Below your bracket are <span className={styles.resultsBelow}>62.65 per cent</span> of income earners
              </div>
            </div>
          ) : (
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
                <label>
                  ${" "}
                  <input
                    onChange={this.handleIncomeChange.bind(this)}
                    type="number"
                  />
                </label>{" "}
                per week
              </div>
              <div className={styles.smalltext}>Enter your weekly income</div>{" "}
            </div>
          )}

          <div className={styles.column + " " + styles.two}>
            <div id="range" />
          </div>
          <div className={styles.column + " " + styles.three}>
            <div className={styles.scaleContainer}>
              <div className={styles.mostRich}>
                <div>
                  <img src="http://www.abc.net.au/res/sites/news-projects/income-comparisons-react/master/ios-arrow-thin-up.svg" />
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
                  <img src="http://www.abc.net.au/res/sites/news-projects/income-comparisons-react/master/ios-arrow-thin-down.svg" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div>
          <button onClick={this.showMore.bind(this)}>
            Show me where I sit
          </button>
        </div>
      </div>,
      document.querySelector(".incomeinput")
    );
  }
}

module.exports = IncomeInput;
