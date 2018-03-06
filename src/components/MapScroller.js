const React = require("react");
const ReactDOM = require("react-dom");
const Scrollyteller = require("@abcnews/scrollyteller");

// D3 modules
const d3Selection = require("d3-selection");

const styles = require("./MapScroller.scss");

let screenWidth = window.innerWidth;
let screenHeight = window.innerHeight;

class MapScroller extends React.Component {
  componentDidMount() {
    canvasInit();
  }
  render() {
    // Create props vars passed to this component
    const { scrollyteller, mapData } = this.props;

    // Wait for data prop to be passed down
    // if (mapData == null) return null;
    // else {
    console.log(mapData);
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
    // }
  }
}

function canvasInit() {
  d3Selection
    .select("." + styles.stage)
    .style("background-color", "LIGHTSTEELBLUE");
}

module.exports = MapScroller;
