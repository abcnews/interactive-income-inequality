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

let lgas = lgaData.map(lga => {
  return { value: lga.LGA_CODE_2016, label: lga.LGA };
});

// Sort alphabetical
lgas = lgas.sort((a, b) => a.label.localeCompare(b.label));

class LgaSearch extends React.Component {
  constructor(props) {
    super(props);

    // Set up component state
    this.state = { searchText: "", selectedOption: "", lgaCode: 0 };

    // Debouncing means fewer multiple MapBox calls
    this.getOptions = debounce(this.getOptions.bind(this), 500);
  }

  handleSelect(selectedOption) {
    this.setState({ selectedOption });
  }

  async geocodeString(searchString) {
    if (!searchString) return [];

    // GET data from the MapBox API to get LongLat of an address string
    const returnedData = await client
      .geocodeForward(searchString, { country: "au" })
      .catch(error => console.log("An error occurred with MapBox... ", error));

    // Handle some errors
    if (returnedData.entity.message === "Not Found") return [];

    if (returnedData && returnedData.entity.features.length === 0) {
      console.log("Address not found...");
      return [];
    }

    return returnedData.entity.features;
  }

  async addressToLGA(address, localAreas) {
    if (!address) return [];

    // Get center of searched address
    let possibleLatLongs = await this.geocodeString(address);

    let foundLGAs = [];

    possibleLatLongs.forEach(lga => {
      let searchLongLat = lga.center;

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

      foundLGAs.push(foundLGA);
    });

    return foundLGAs[0];
  }

  async addressToLGAs(address, localAreas) {
    if (!address) return [];

    // Get center of searched address
    let possibleLatLongs = await this.geocodeString(address);

    let foundLGAs = [];

    possibleLatLongs.forEach(lga => {
      let searchLongLat = lga.center;

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

      foundLGAs.push(foundLGA);
    });

    return foundLGAs;
  }

  getOptions(input, callback) {
    setTimeout(async () => {
      let filteredLgas;

      // Check if string is a postcode
      if (/^[0-9]{4}$/.test(input)) {
        console.log("Postcode detected...");

        let lgaFromPostcode = await this.addressToLGA(
          input,
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

        // Show matching local LGAs otherwise assume address search
        if (filteredLgas.length == 0) {
          this.geocodeString(input);

          console.log("searching by address");

          let lgaFromAddress = await this.addressToLGA(
            input,
            this.props.mapData
          );

          let lgasFromAddress = await this.addressToLGAs(
            input,
            this.props.mapData
          );

          console.log(lgasFromAddress);

          const lgaCode =
            lgaFromAddress && Number(lgaFromAddress.properties.LGA_CODE16);

          const lgaCodes = lgasFromAddress.map(lga =>
            Number(lga.properties.LGA_CODE16)
          );

          // filteredLgas = lgas.filter(lga => {
          //   return lga.value === lgaCode;
          // });
          filteredLgas = lgas.filter(lga => {
            return lgaCodes.indexOf(lga.value) > -1;
          });
          callback(null, {
            options: filteredLgas
          });
        } else {
          callback(null, {
            options: filteredLgas
          });
        }
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
