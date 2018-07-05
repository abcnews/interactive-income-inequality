const React = require("react");
const ReactDOM = require("react-dom");

const styles = require("./DumbbellTop.scss");

class DumbbellTop extends React.Component {
  render() {
    return ReactDOM.createPortal(
      <div className={styles.wrapper}>{this.props.children}</div>,
      document.querySelector(".dumbbelltop")
    );
  }
}

module.exports = DumbbellTop;
