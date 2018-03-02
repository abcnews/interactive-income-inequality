const React = require("react");
const ReactDOM = require("react-dom")
const styles = require("./MapScroller.scss");

class MapScroller extends React.Component {
  render() {
    // Create props vars passed to this component
    const { scrollyteller } = this.props;

    return ReactDOM.createPortal(
      <div className={styles.wrapper}>
        Find me in <strong>src/components/MapScroller.js</strong>
      </div>,
      scrollyteller.mountNode
    );
  }
}

module.exports = MapScroller;
