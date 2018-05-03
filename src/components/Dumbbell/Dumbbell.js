const React = require("react");
const styles = require("./Dumbbell.scss");

class Dumbbell extends React.Component {
  getActualPercent(percent) {
    let actualPercent = percent / 10;
    return parseFloat(actualPercent.toFixed(2));
  }
  render() {
    let {dot1Percent, dot2Percent} = this.props;
    return (
      <div className={styles.wrapper}>
        <div className={styles.label}>{this.props.label}</div>
        <div className={styles.chart}>
          <div className={styles.midBar} />
          <span
            className={styles.line1}
            style={{ left: this.props.line1Percent + "%" }}
          />
          <span
            className={styles.dot1}
            style={{ left: this.props.dot1Percent + "%" }}
          />
          <span
            className={styles.dot1Percent}
            style={{ left: "calc(" + this.props.dot1Percent + "% - 8px)" }}
          >
            {this.getActualPercent(dot1Percent)}%
          </span>
          <span
            className={styles.dot2}
            style={{ left: this.props.dot2Percent + "%" }}
          />
          <span
            className={styles.dot2Percent}
            style={{ left: "calc(" + this.props.dot2Percent + "% + 10px)" }}
          >
            {this.getActualPercent(dot2Percent)}%
          </span>
          
        </div>
      </div>
    );
  }
}

module.exports = Dumbbell;
