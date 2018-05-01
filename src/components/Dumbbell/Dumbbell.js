const React = require('react');
const styles = require('./Dumbbell.scss');

class Dumbbell extends React.Component {
  render() {
    return (
      <div className={styles.wrapper}>
        <b>{this.props.label}</b>
      </div>
    );
  }
}

module.exports = Dumbbell;