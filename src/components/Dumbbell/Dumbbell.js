const React = require("react");
const d3Scale = require("d3-scale");

const styles = require("./Dumbbell.scss");

 

class Dumbbell extends React.Component {
  constructor(props) {
    super(props);

    this.scale = d3Scale.scaleLinear()
      .domain([0, this.props.maxValue || 100])
      .range([0, 100]);

    this.state = {
      
    };
  }

  getActualPercent(percent) {
    let actualPercent = percent * this.props.percentMultiplier || percent * 1;
    return parseFloat(actualPercent.toFixed(2));
  }

  render() {
    // Extract vars
    let { dot1Percent, dot2Percent, line1Percent } = this.props;

    // Align the labels
    let dot1Align = "left";
    let dot2Align = "right";

    if (dot1Percent < dot2Percent) {
      dot1Align = "left";
      dot2Align = "right";
    } else {
      dot1Align = "right";
      dot2Align = "left";
    }

    // If too close to the borders flip them
    if (this.scale(dot1Percent) < 6) dot1Align = "right";
    if (this.scale(dot2Percent) < 6) dot2Align = "right";

    if (this.scale(dot1Percent) > 94) dot1Align = "left";
    if (this.scale(dot2Percent) > 94) dot2Align = "left";

    return (
      <div className={styles.wrapper}>
        <div className={styles.label}>{this.props.label}</div>
        <div className={styles.chart}>
          <div className={styles.midBar} />
          {this.props.line1Percent && (
            <span
              className={styles.line1}
              style={{ left: this.scale(line1Percent) + "%" }}
            />
          )}
          <span className={styles.dot1} style={{ left: this.scale(dot1Percent) + "%" }} />
          <span className={styles.dot2} style={{ left: this.scale(dot2Percent) + "%" }} />
          {/* Check if we want dot1 labels left or right */}
          {dot1Align === "left" ? (
            <span
              className={styles.dot1Percent}
              style={{ left: "calc(" + this.scale(dot1Percent) + "% - 8px)" }}
            >
              {this.getActualPercent(dot1Percent)}%
            </span>
          ) : (
            <span
              className={styles.dot1PercentRight}
              style={{ left: "calc(" + this.scale(dot1Percent) + "% + 10px)" }}
            >
              {this.getActualPercent(dot1Percent)}%
            </span>
          )}
          {/* Check if we want dot2 labels left or right */}
          {dot2Align === "left" ? (
            <span
              className={styles.dot2Percent}
              style={{ left: "calc(" + this.scale(dot2Percent) + "% - 8px)" }}
            >
              {this.getActualPercent(dot2Percent)}%
            </span>
          ) : (
            <span
              className={styles.dot2PercentRight}
              style={{ left: "calc(" + this.scale(dot2Percent) + "% + 10px)" }}
            >
              {this.getActualPercent(dot2Percent)}%
            </span>
          )}
        </div>
      </div>
    );
  }
}

module.exports = Dumbbell;
