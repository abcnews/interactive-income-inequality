const React = require("react");
const styles = require("./Dumbbell.scss");

let dot1Styles = {
  left: "40%"
}

let dot2Styles = {
  left: "60%"
}

class Dumbbell extends React.Component {
  render() {

    return (
      <div className={styles.wrapper}>
        <div className={styles.label}>
          {this.props.label}
        </div>
        <div className={styles.chart}>
          <div className={styles.midBar} />
          <span className={styles.dot1} style={{left: this.props.dot1Percent + "%"}}></span>
          <span className={styles.dot2} style={{left: this.props.dot2Percent + "%"}}></span>
        </div>
      </div>
    );
  }
}

module.exports = Dumbbell;
