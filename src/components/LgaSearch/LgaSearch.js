const React = require("react");
const ReactDOM = require("react-dom");
const styles = require("./LgaSearch.scss");

class LgaSearch extends React.Component {
  constructor(props) {
    super(props);

    // Set up component state
    this.state = { searchText: "" };

    // Bind component functions
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  handleSubmit(event) {
    event.preventDefault();
    // console.log(event.target["0"].value);
    this.props.onLocaleIntent(event.target["0"].value);
  }

  // Fires on each keypress
  handleChange(event) {
    if (!event) return;

    let searchText = event.target.value;

    this.setState({ searchText: searchText }); // async

    // Check if string is a postcode
    if (/^[0-9]{4}$/.test(searchText)) {
      console.log("It's probably a postcode!!!!!!");
      this.props.onLocaleIntent(searchText + " australia");
    }
  }

  render() {
    return ReactDOM.createPortal(
      <div className={styles.wrapper}>
        <form onSubmit={this.handleSubmit}>
          <input
            placeholder="Enter LGA, postcode or address"
            onChange={this.handleChange}
          />
        </form>
        <p>{this.props.localGovernmentArea}</p>
        <p>{this.state.searchText}</p>
      </div>,
      document.querySelector(".addressinput")
    );
  }
}

module.exports = LgaSearch;
