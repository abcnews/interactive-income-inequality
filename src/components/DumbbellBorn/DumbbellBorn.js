const React = require("react");
const ReactDOM = require("react-dom");

const styles = require("./DumbbellBorn.scss");

class DumbbellBorn extends React.Component {
  render() {
    return ReactDOM.createPortal(
      <div className={styles.wrapper}>{this.props.children}</div>,
      document.querySelector(".dumbbellborn")
    );
  }
}

module.exports = DumbbellBorn;
