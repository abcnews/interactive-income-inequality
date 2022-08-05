const React = require("react");
const ReactDOM = require("react-dom");

const styles = require("./DumbbellIndigenous.scss");

class DumbbellIndigenous extends React.Component {
  render() {
    return ReactDOM.createPortal(
      <div className={styles.wrapper}>{this.props.children}</div>,
      document.querySelector("#dumbbellindigenous")
    );
  }
}

module.exports = DumbbellIndigenous;
