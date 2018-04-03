const React = require("react");
const ReactDOM = require("react-dom");
const styles = require("./LgaSearch.scss");


class LgaSearch extends React.Component {
  constructor(props) {
    super(props);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  handleSubmit(event) {
    event.preventDefault();
    // console.log(event.target["0"].value);
    this.props.onLocaleIntent(event.target["0"].value);
  }

  handleChange() {}

  render() {
    const value = "Hello";
    return ReactDOM.createPortal(
      <div className={styles.wrapper}>
        <form onSubmit={this.handleSubmit}>
          <input
            placeholder="Enter LGA, postcode or address"
            onChange={this.handleChange}
          />
        </form>
        <div>{this.props.localGovernmentArea}</div>
        
      </div>,
      document.querySelector(".addressinput")
    );
  }
}

module.exports = LgaSearch;
