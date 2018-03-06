const React = require("react");
const ReactDOM = require("react-dom");
const Scrollyteller = require("@abcnews/scrollyteller");

// D3 modules
const d3Selection = require("d3-selection");

const styles = require("./MapScroller.scss");


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
        >
          <canvas className={styles.stage} />
        </Scrollyteller>
      </div>,
      scrollyteller.mountNode
    );
  }
}

module.exports = MapScroller;
