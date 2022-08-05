const React = require("react");
const ReactDOM = require("react-dom");

const styles = require("./DumbbellContMarriage.scss");

class DumbbellContMarriage extends React.Component {
  render() {
    return ReactDOM.createPortal(
      <div className={styles.wrapper}>{this.props.children}</div>,
      document.querySelector("#dumbbellcontmarriage")
    );
  }
}

module.exports = DumbbellContMarriage;
