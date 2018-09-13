const React = require("react");
const d3Scale = require("d3-scale");

const styles = require("./Dumbbell.scss");

class Dumbbell extends React.Component {
  constructor(props) {
    super(props);

    this.scale = d3Scale
      .scaleLinear()
      .domain([0, this.props.maxValue || 100])
      .range([0, 100]);

    this.state = {};
  }

  getActualPercent(percent) {
    let actualPercent = percent * this.props.percentMultiplier || percent * 1;
    return parseFloat(actualPercent.toFixed(2));
  }

  componentWillReceiveProps(nextProps) {
    this.scale = d3Scale
      .scaleLinear()
      .domain([0, nextProps.maxValue || 100])
      .range([0, 100]);
  }

  render() {
    // Extract vars
    let { dot1Percent, dot2Percent, line1Percent, isInTopBracket } = this.props;

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
    if (this.scale(dot1Percent) < 0) dot1Align = "right";
    if (this.scale(dot2Percent) < 0) dot2Align = "right";

    if (this.scale(dot1Percent) > 92) dot1Align = "left";
    if (this.scale(dot2Percent) > 92) dot2Align = "left";

    // Modify some styles
    let dot1Style = { left: this.scale(dot1Percent) + "%" };
    let dot2Style = { left: this.scale(dot2Percent) + "%" };
    let dot1PercentStyle = {
      left: "calc(" + this.scale(dot1Percent) + "% - 8px)"
    };
    let dot1PercentRightStyle = {
      left: "calc(" + this.scale(dot1Percent) + "% + 10px)"
    };
    let dot2PercentStyle = {
      left: "calc(" + this.scale(dot2Percent) + "% - 8px)"
    };
    let dot2PercentRightStyle = {
      left: "calc(" + this.scale(dot2Percent) + "% + 10px)"
    };
    let dot1LabelStyle = {
      left: "calc(" + this.scale(dot1Percent) + "% - 8px)"
    };
    let dot1LabelRightStyle = {
      left: "calc(" + this.scale(dot1Percent) + "% + 10px)"
    };
    let dot2LabelStyle = {
      left: "calc(" + this.scale(dot2Percent) + "% - 8px)"
    };
    let dot2LabelRightStyle = {
      left: "calc(" + this.scale(dot2Percent) + "% + 10px)"
    };

    // Don't push the average too far
    // TODO: maybe make this more elegant by calculating the width
    let lineLabelWithinLimits = this.scale(line1Percent);

    if (lineLabelWithinLimits < 10) lineLabelWithinLimits = 10;
    else if (lineLabelWithinLimits > 90) lineLabelWithinLimits = 90;

    let line1LabelStyle = { left: lineLabelWithinLimits + "%" };

    // Custom dot colors
    if (this.props.dot1Color && this.props.dot1TextColor) {
      dot1Style.backgroundColor = this.props.dot1Color;
      dot1PercentStyle.color = this.props.dot1TextColor;
      dot1PercentRightStyle.color = this.props.dot1TextColor;
    }

    if (this.props.dot2Color && this.props.dot2TextColor) {
      dot2Style.backgroundColor = this.props.dot2Color;
      dot2PercentStyle.color = this.props.dot2TextColor;
      dot2PercentRightStyle.color = this.props.dot2TextColor;
    }

    if (this.props.dot1LabelColor) {
      dot1LabelStyle.color = this.props.dot1LabelColor;
      dot1LabelRightStyle.color = this.props.dot1LabelColor;
    }

    if (this.props.dot2LabelColor) {
      dot2LabelStyle.color = this.props.dot2LabelColor;
      dot2LabelRightStyle.color = this.props.dot2LabelColor;
    }

    return (
      <div>
        <div className={styles.screenReaderOnly}>
          {this.props.label +
            ". Your bracket: " +
            this.props.dot1Percent +
            " per cent. " +
            (isInTopBracket ? "Bottom bracket: " : "Top Bracket: ") +
            this.props.dot2Percent +
            " per cent. Average of all brackets: " +
            this.props.line1Percent +
            " per cent."}
        </div>
        <div className={styles.wrapper} aria-hidden="true">
          <div className={styles.label}>{this.props.label}</div>
          <div className={styles.chart}>
            {line1Percent && (
              <span
                className={styles.line1}
                style={{ left: this.scale(line1Percent) + "%" }}
              />
            )}

            {dot1Percent && <span className={styles.dot1} style={dot1Style} />}
            <span className={styles.dot2} style={dot2Style} />
            {/* Check if we want dot1 labels left or right */}
            {dot1Percent &&
              (dot1Align === "left" ? (
                <span className={styles.dot1Percent} style={dot1PercentStyle}>
                  {this.getActualPercent(dot1Percent)}%
                </span>
              ) : (
                <span
                  className={styles.dot1PercentRight}
                  style={dot1PercentRightStyle}
                >
                  {this.getActualPercent(dot1Percent)}%
                </span>
              ))}
            {/* Dot 1 labels if applicable */}
            {this.props.dot1Label &&
              (dot1Align === "left" ? (
                <span className={styles.dot1Label} style={dot1LabelStyle}>
                  {this.props.dot1Label}
                </span>
              ) : (
                <span
                  className={styles.dot1LabelRight}
                  style={dot1LabelRightStyle}
                >
                  {this.props.dot1Label}
                </span>
              ))}
            {/* Dot 2 labels if applicable */}
            {this.props.dot2Label &&
              (dot2Align === "left" ? (
                <span className={styles.dot2Label} style={dot2LabelStyle}>
                  {this.props.dot2Label}
                </span>
              ) : (
                <span
                  className={styles.dot2LabelRight}
                  style={dot2LabelRightStyle}
                >
                  {this.props.dot2Label}
                </span>
              ))}
            {/* Check if we want dot2 percents left or right */}
            {dot2Align === "left" ? (
              <span className={styles.dot2Percent} style={dot2PercentStyle}>
                {this.getActualPercent(dot2Percent)}%
              </span>
            ) : (
              <span
                className={styles.dot2PercentRight}
                style={dot2PercentRightStyle}
              >
                {this.getActualPercent(dot2Percent)}%
              </span>
            )}
            {/* Mid bar */}
            <div className={styles.midBar} />
            {this.props.line1Label && (
              <span className={styles.line1Label} style={line1LabelStyle}>
                {this.props.line1Label}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }
}

module.exports = Dumbbell;
