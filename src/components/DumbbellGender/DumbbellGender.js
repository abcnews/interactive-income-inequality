const React = require('react');
const ReactDOM = require("react-dom");

const styles = require('./DumbbellGender.scss');

class DumbbellGender extends React.Component {
  render() {
    return ReactDOM.createPortal(
      <div className={styles.wrapper}>
        {this.props.children}
      </div>, document.querySelector(".dumbbellgender")
    );
  }
}

module.exports = DumbbellGender;