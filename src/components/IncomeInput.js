const React = require("react");
const styles = require("./IncomeInput.scss");
const ReactDOM = require("react-dom");

const Portal = require("react-portal");

class IncomeInput extends React.Component {
  handleIncomeChange() {
    console.log("Income changed...");
  }
  handleEstimationChange() {
    console.log("changed...");
  }
  showMore(event) {
    console.log(event);
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
            <input
              onChange={this.handleEstimationChange.bind(this)}
              orient="vertical"
              type="range"
              step="1"
              value="100"
              min="1"
              max="200"
            />
          </div>
        </div>
        <div>
          <button onClick={this.showMore.bind(this)}>
            Show me where I sit
          </button>
        </div>
      </div>,
      document.querySelector(".income-input")
    );
  }
}

module.exports = IncomeInput;
