const React = require("react");
const ReactDOM = require("react-dom");

const styles = require("./DumbbellVoluntary.scss");

class DumbbellVoluntary extends React.Component {
  render() {
    return ReactDOM.createPortal(
      <div className={styles.wrapper}>{this.props.children}</div>,
      document.querySelector("#dumbbellvoluntary")
    );
  }
}

module.exports = DumbbellVoluntary;
