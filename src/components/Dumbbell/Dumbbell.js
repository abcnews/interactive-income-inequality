const React = require("react");
const styles = require("./Dumbbell.scss");

class Dumbbell extends React.Component {
  render() {
    return (
      <div className={styles.wrapper}>
        <div className={styles.label}>
          {this.props.label}
        </div>
        <div className={styles.chart}>
          <div className={styles.midBar} />
          <span className={styles.your}>●</span>
        </div>
      </div>
    );
  }
}

module.exports = Dumbbell;
