const React = require("react");
const ReactDOM = require("react-dom");
const styles = require("./LgaSearch.scss");
const MapboxClient = require("mapbox");
const inside = require("point-in-polygon");
const debounce = require("debounce");

// const Select = require("react-select").default;
const Async = require("react-select").Async;

// Configuration
const config = {
  mapbox_token:
    "cGsuZXlKMUlqb2libVYzY3kxdmJqRnBibVVpTENKaElqb2lZMnBqYXpFM09UbDNNRFV5ZVRKM2NHbDJOV1J4Y0RocE55SjkuS3c0bGhBYkxVazlJUGF6dXRCZTI4dw=="
};

// Constants
const MAPBOX_TOKEN = atob(config.mapbox_token);

// Initialise Mapbox
const client = new MapboxClient(MAPBOX_TOKEN);

// Load up all the LGAs
const lgaData = require("./lgas.json").lgas;

const lgas = lgaData.map(lga => {
  return { value: lga.LGA_CODE_2016, label: lga.LGA };
});

class LgaSearch extends React.Component {
  constructor(props) {
    super(props);

    // Set up component state
    this.state = { searchText: "", selectedOption: "", lgaCode: 0 };

    // Debouncing means no multiple MapBox calls
    this.getOptions = debounce(this.getOptions.bind(this), 500);
  }

  // Fires on each keypress
  // handleChange(event) {
  //   if (!event) return;

  //   let searchText = event.target.value;

  //   this.setState({ searchText: searchText }); // probably async

  //   // Check if string is a postcode
  //   if (/^[0-9]{4}$/.test(searchText)) {
  //     console.log("It's probably a postcode!!!!!!");
  //     this.props.onLocaleIntent(searchText + " australia");
  //   }
  // }

  handleSelect(selectedOption) {
    this.setState({ selectedOption });
  }

  async addressToLGA(address, localAreas) {
    if (!address) return;

    // GET data from the MapBox API to get LongLat of an address string
    const returnedData = await client
      .geocodeForward(address, { test: "test" })
      .catch(error => console.log("An error occurred with MapBox... ", error));

    // console.log(returnedData);

    // Handle some errors
    if (returnedData.entity.message === "Not Found") return;

    if (returnedData && returnedData.entity.features.length === 0) {
      console.log("Address not found...");
      return;
    }

    // Get center of searched address
    searchLongLat = returnedData.entity.features[0].center;

    let foundLGA;

    // Loop through all Local Government Areas
    // TODO: maybe make this a separate function
    localAreas.forEach(LGA => {
      let currentLGA = LGA.geometry;

      if (currentLGA && currentLGA.type === "Polygon") {
        // Handle Polygon geometry types
        if (inside(searchLongLat, currentLGA.coordinates[0])) {
          foundLGA = LGA; //.properties.LGA_NAME16;
        }
      } else if (currentLGA && currentLGA.type === "MultiPolygon") {
        // Handle MultiPolygon geometry type
        currentLGA.coordinates.forEach(polygon => {
          if (inside(searchLongLat, polygon[0])) {
            foundLGA = LGA; //.properties.LGA_NAME16;
          }
        });
      }
    });

    // this.setState({
    //   localGovernmentArea: foundLGA
    // });

    return foundLGA;
  }

  // componentWillReceiveProps(nextProps) {
  //   // console.log(nextProps);

  //   this.setState({ lgaCode: nextProps.localGovernmentArea.LGA_CODE_2016 });
  // }

  getOptions(input, callback) {
    setTimeout(async () => {
      console.log("bounce");
      // callback(null, {
      //   options: lgas,
      //   // CAREFUL! Only set this to true when there are no more options,
      //   // or more specific queries will not be sent to the server.
      //   complete: true
      // });
      let filteredLgas;

      // Check if string is a postcode
      if (/^[0-9]{4}$/.test(input)) {
        console.log("Postcode detected...");
        // this.props.geoCodeAddress(value + " australia");
        // console.log(await this.addressToLGA(value + " australia", this.props.mapData));
        let lgaFromPostcode = await this.addressToLGA(
          input + " australia",
          this.props.mapData
        );

        const lgaCode =
          lgaFromPostcode && Number(lgaFromPostcode.properties.LGA_CODE16);

        filteredLgas = lgas.filter(lga => {
          return lga.value === lgaCode;
        });

        callback(null, {
          options: filteredLgas
        });
      } else {
        filteredLgas = lgas.filter(lga => {
          return lga.label.toLowerCase().indexOf(input.toLowerCase()) > -1;
        });

        callback(null, {
          options: filteredLgas
        });
      }
    }, 1); // Async component expects async to we fake it
    // even though debouncing might not need it
  }

  render() {
    const { selectedOption } = this.state;
    const value = selectedOption && selectedOption.value;

    console.log(value);

    return ReactDOM.createPortal(
      <div className={styles.wrapper}>
        <Async
          name="lga-async-search"
          value={value}
          onChange={this.handleSelect.bind(this)}
          loadOptions={this.getOptions}
          // autoload={false}
          filterOptions={(options, filter, currentValues) => {
            // Do filtering in loadOptions instead
            return options;
          }}
          onBlurResetsInput={false}
          onCloseResetsInput={false}
          placeholder="Enter LGA, postcode or address"
        />
      </div>,
      document.querySelector(".addressinput")
    );
  }
}

module.exports = LgaSearch;
