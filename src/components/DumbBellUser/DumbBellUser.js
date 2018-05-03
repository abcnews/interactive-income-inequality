const React = require('react');
const ReactDOM = require("react-dom");

const styles = require('./DumbBellUser.scss');

class DumbBellUser extends React.Component {
  render() {
    return ReactDOM.createPortal(
      <div className={styles.wrapper}>
        {this.props.children}
      </div>, document.querySelector(".dumbbelluser")
    );
  }
}

module.exports = DumbBellUser;