const React = require('react');
const styles = require('./IncomeResult.scss');

class IncomeResult extends React.Component {
  render() {
    return (
      <div className={styles.wrapper}>
        Find me in <strong>src/components/IncomeResult.js</strong>
      </div>
    );
  }
}

module.exports = IncomeResult;