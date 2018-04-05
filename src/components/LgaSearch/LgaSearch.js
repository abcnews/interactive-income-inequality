const React = require("react");
const ReactDOM = require("react-dom");
const styles = require("./LgaSearch.scss");

// const Select = require("react-select/dist/react-select.js")
const Select = require("react-select").default;

console.log(Select);

// import Select from 'react-select';
// require('react-select/dist/react-select.css');

// import 'react-select/dist/react-select.css';

// Load up all the LGAs
const lgaData = require("./lgas.json").lgas;

const lgas = lgaData.map(lga => {
  return { value: lga.LGA_CODE_2016, label: lga.LGA };
});

console.log(lgas);

class LgaSearch extends React.Component {
  constructor(props) {
    super(props);

    // Set up component state
    this.state = { searchText: "", selectedOption: "" };

    // Bind component functions
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleSelect = this.handleSelect.bind(this);
  }

  handleSubmit(event) {
    if (event) {
      event.preventDefault();
      // console.log(event.target["0"].value);
      this.props.onLocaleIntent(event.target["0"].value);
    }
  }

  // Fires on each keypress
  handleChange(event) {
    if (!event) return;

    let searchText = event.target.value;

    this.setState({ searchText: searchText }); // probably async

    // Check if string is a postcode
    if (/^[0-9]{4}$/.test(searchText)) {
      console.log("It's probably a postcode!!!!!!");
      this.props.onLocaleIntent(searchText + " australia");
    }
  }

  handleSelect(selectedOption) {
    this.setState({ selectedOption });
    console.log(`Selected: ${selectedOption.label}`);
  }

  render() {
    const { selectedOption } = this.state;
    const value = selectedOption && selectedOption.value;

    return ReactDOM.createPortal(
      <div className={styles.wrapper}>
        <form onSubmit={this.handleSubmit}>
          <input
            placeholder="Enter LGA, postcode or address"
            onChange={this.handleChange}
          />
        </form>
        {/* <ul className={styles.dropDown}>{lgas}</ul> */}
        <p>{this.props.localGovernmentArea}</p>
        <p>{this.state.searchText}</p>

        <Select
          name="lga-search"
          value={value}
          onChange={this.handleSelect}
          options={lgas}
        />
      </div>,
      document.querySelector(".addressinput")
    );
  }
}

module.exports = LgaSearch;
