const React = require("react");
const ReactDOM = require("react-dom");

const styles = require("./DumbbellEducation.scss");

class DumbbellEducation extends React.Component {
  render() {
    return ReactDOM.createPortal(
      <div className={styles.wrapper}>{this.props.children}</div>,
      document.querySelector("#dumbbelleducation")
    );
  }
}

module.exports = DumbbellEducation;
