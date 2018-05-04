const React = require('react');
const styles = require('./DumbbellCar.scss');

class DumbbellCar extends React.Component {
  render() {
    return (
      <div className={styles.wrapper}>
        Find me in <strong>src/components/DumbbellCar.js</strong>
      </div>
    );
  }
}

module.exports = DumbbellCar;