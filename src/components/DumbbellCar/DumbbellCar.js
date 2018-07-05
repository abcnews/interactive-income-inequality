const React = require("react");
const ReactDOM = require("react-dom");

const styles = require("./DumbbellCar.scss");

class DumbbellCar extends React.Component {
  render() {
    return ReactDOM.createPortal(
      <div className={styles.wrapper}>{this.props.children}</div>,
      document.querySelector(".dumbbellcar")
    );
  }
}

module.exports = DumbbellCar;
