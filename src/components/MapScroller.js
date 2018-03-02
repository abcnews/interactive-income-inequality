const React = require("react");
const ReactDOM = require("react-dom");
const styles = require("./MapScroller.scss");

const Scrollyteller = require("@abcnews/scrollyteller");

class MapScroller extends React.Component {
  render() {
    // Create props vars passed to this component
    const { scrollyteller } = this.props;

    console.log(scrollyteller.panels)

    const panels = scrollyteller.panels;

    return ReactDOM.createPortal(
      <div className={styles.wrapper}>
        <Scrollyteller
        // panels={panels}
        className={`Block is-richtext is-piecemeal ${styles.scrollyteller}`}
        panelClassName="Block-content u-layout u-richtext"
          
        />
      </div>,
      scrollyteller.mountNode
    );
  }
}

module.exports = MapScroller;
