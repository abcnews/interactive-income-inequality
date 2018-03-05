const React = require("react");
const ReactDOM = require("react-dom");
const styles = require("./MapScroller.scss");

const Scrollyteller = require("@abcnews/scrollyteller");

class MapScroller extends React.Component {
  render() {
    // Create props vars passed to this component
    const { scrollyteller } = this.props;

    return ReactDOM.createPortal(
      <div className={styles.wrapper}>
        <Scrollyteller
          panels={scrollyteller.panels}
          className={`Block is-richtext is-piecemeal ${styles.scrollyteller}`}
          panelClassName="Block-content u-layout u-richtext"
          onMarker={console.log}
        />
      </div>,
      scrollyteller.mountNode
    );
  }
}

module.exports = MapScroller;
