const React = require('react');
const styles = require('./DumbbellGender.scss');

class DumbbellGender extends React.Component {
  render() {
    return (
      <div className={styles.wrapper}>
        Find me in <strong>src/components/DumbbellGender.js</strong>
      </div>
    );
  }
}

module.exports = DumbbellGender;