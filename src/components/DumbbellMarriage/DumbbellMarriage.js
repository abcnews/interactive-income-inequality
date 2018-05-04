const React = require('react');
const ReactDOM = require("react-dom");

const styles = require('./DumbbellMarriage.scss');

class DumbbellMarriage extends React.Component {
  render() {
    return ReactDOM.createPortal(
      <div className={styles.wrapper}>
        {this.props.children}
      </div>, document.querySelector(".dumbbellmarriage")
    );
  }
}

module.exports = DumbbellMarriage;