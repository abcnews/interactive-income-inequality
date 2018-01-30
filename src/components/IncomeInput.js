const React = require("react");
const styles = require("./IncomeInput.scss");
const ReactDOM = require("react-dom");
const Portal = require("react-portal");
const noUiSlider = require("nouislider");
const wNumb = require("wnumb");

class IncomeInput extends React.Component {
  constructor(props) {
    super(props);
    this.state = { income: "" };
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
  }
  componentDidMount() {
    var slider = document.getElementById("range");

    slider.style.height = "300px";
    slider.style.margin = "0 auto 30px";

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
    return ReactDOM.createPortal(
      <div className={styles.wrapper}>
        <div className={styles.flexWrapper}>
          <div className={styles.column + " " + styles.one}>
            <div className={styles.boldtext}>
              Where do you think your income bracket sits on the scale of least
              to most rich Australians?
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
                  type="text"
                />
              </label>{" "}
              per week
            </div>
            <div className={styles.smalltext}>Enter your weekly income</div>
          </div>
          <div className={styles.column + " " + styles.two}>
            {/* <input
              onChange={this.handleEstimationChange.bind(this)}
              // orient="vertical"
              type="range"
              step="1"
              value="100"
              min="1"
              max="200"
            /> */}
            {/* <svg className="range-slider" width="200" height="480" /> */}
            <div id="range" />
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
