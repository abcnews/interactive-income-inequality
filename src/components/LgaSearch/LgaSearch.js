const React = require("react");
const ReactDOM = require("react-dom");
const MapboxClient = require("mapbox");
const inside = require("point-in-polygon");
const debounce = require("debounce");
const smoothScroll = require("smoothscroll");

const styles = require("./LgaSearch.scss");

// Smooth scroll into view support for Safari, Edge, IE, etc.
const smoothScrollPollyfill = require("smoothscroll-polyfill");
smoothScrollPollyfill.polyfill();

const Async = require("react-select").Async;

// Configuration
const config = {
  mapbox_token:
    "cGsuZXlKMUlqb2libVYzY3kxdmJqRnBibVVpTENKaElqb2lZMnBqYXpFM09UbDNNRFV5ZVRKM2NHbDJOV1J4Y0RocE55SjkuS3c0bGhBYkxVazlJUGF6dXRCZTI4dw=="
};

// Constants
const MAPBOX_TOKEN = atob(config.mapbox_token);
const ADDRESS_RELEVANCE_THRESHOLD = 0.5;

// Initialise Mapbox
const client = new MapboxClient(MAPBOX_TOKEN);

// Load up all the LGAs
const lgaData = require("./lgas.json").lgas;

// Remove the extra LGA codes
let lgas = lgaData.map(lga => {
  return {
    value: lga.LGA_CODE_2016,
    label: lga.LGA.replace(/ *\([^)]*\) */g, "")
  };
});

// Separate states
lgas = lgas.map(lga => {
  let stateCode = Math.floor(lga.value / 10000);

  if (stateCode === 1) {
    return { value: lga.value, label: lga.label + " (NSW)" };
  } else if (stateCode === 2) {
    return { value: lga.value, label: lga.label + " (VIC)" };
  } else if (stateCode === 3) {
    return { value: lga.value, label: lga.label + " (QLD)" };
  } else if (stateCode === 4) {
    return { value: lga.value, label: lga.label + " (SA)" };
  } else if (stateCode === 5) {
    return { value: lga.value, label: lga.label + " (WA)" };
  } else if (stateCode === 6) {
    return { value: lga.value, label: lga.label + " (TAS)" };
  } else if (stateCode === 7) {
    return { value: lga.value, label: lga.label + " (NT)" };
  } else if (stateCode === 8) {
    return { value: lga.value, label: lga.label + " (ACT)" };
  } else if (stateCode === 9) {
    return { value: lga.value, label: lga.label + " (OTHER)" };
  } else {
    return { value: lga.value, label: lga.label };
  }
});

// Filter unwanted LGAs
lgas = lgas.filter(lga => {
  return lga.label.search(/No usual address/) < 0;
});

// Sort LGAs alphabetically
lgas = lgas.sort((a, b) => a.label.localeCompare(b.label));

class LgaSearch extends React.Component {
  constructor(props) {
    super(props);

    // Set up component state
    this.state = { selectedOption: null };

    // Debouncing means fewer multiple MapBox calls
    this.getOptions = debounce(this.getOptions.bind(this), 500);
  }

  handleSelect(selectedOption) {
    this.setState({ selectedOption });
    this.props.setCurrentLga(selectedOption);

    // Handle clear the select
    if (selectedOption == null) return;

    // Select element and scroll to it
    let firstPanel = document.querySelector('[name="scrolltothispoint"]');

    if (!firstPanel) return;

    // Use an NPM module to scroll because native scolling is not consistent across browsers
    smoothScroll(firstPanel);
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
      // TODO: alert the user maybe
      return [];
    }

    let relevanceFiltered = returnedData.entity.features.filter(feature => {
      return feature.relevance > ADDRESS_RELEVANCE_THRESHOLD;
    });

    return relevanceFiltered;
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
      localAreas.forEach(LGA => {
        let currentLGA = LGA.geometry;

        if (currentLGA && currentLGA.type === "Polygon") {
          // Handle Polygon geometry types
          if (inside(searchLongLat, currentLGA.coordinates[0])) {
            foundLGA = LGA;
          }
        } else if (currentLGA && currentLGA.type === "MultiPolygon") {
          // Handle MultiPolygon geometry type
          currentLGA.coordinates.forEach(polygon => {
            if (inside(searchLongLat, polygon[0])) {
              foundLGA = LGA;
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
        let lgaFromPostcode = await this.addressToLGAs(
          input,
          this.props.mapData
        );

        const lgaCode =
          lgaFromPostcode[0] &&
          Number(lgaFromPostcode[0].properties.LGA_CODE16);

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
          let lgasFromAddress = await this.addressToLGAs(
            input,
            this.props.mapData
          );

          const lgaCodes = lgasFromAddress.map(
            lga => lga && Number(lga.properties.LGA_CODE16)
          );

          filteredLgas = [];

          // Try alphabetising
          lgaCodes.forEach(code => {
            lgas.forEach(lga => {
              if (lga.value === code) {
                filteredLgas.push(lga);
                return;
              }
            });
          });

          // Remove duplicates
          let uniqueFilteredLgas = filteredLgas.filter(function(item, pos) {
            return filteredLgas.indexOf(item) == pos;
          });

          callback(null, {
            options: uniqueFilteredLgas
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

  renderOption(option) {
    // Add formatting tags to drop down options
    let labelSplit = option.label.split("(");

    labelSplit[0] = labelSplit[0].slice(0, -1);
    labelSplit[1] = labelSplit[1].slice(0, -1);

    let lgaOption = labelSplit[0];
    let stateAbbreviation = labelSplit[1];
    let stateFullName = stateAbbreviation;

    if (stateAbbreviation === "NSW") stateFullName = "New South Wales";
    else if (stateAbbreviation === "VIC") stateFullName = "Victoria";
    else if (stateAbbreviation === "QLD") stateFullName = "Queensland";
    else if (stateAbbreviation === "SA") stateFullName = "South Australia";
    else if (stateAbbreviation === "WA") stateFullName = "Western Australia";
    else if (stateAbbreviation === "TAS") stateFullName = "Tasmania";
    else if (stateAbbreviation === "NT") stateFullName = "Northern Territory";
    else if (stateAbbreviation === "ACT")
      stateFullName = "Australian Capital Territory";
    else if (stateAbbreviation === "OTHER") stateFullName = "Other";

    return (
      <div>
        {lgaOption} <small>{stateFullName}</small>
      </div>
    );
  }

  componentDidMount() {
    // Add accessibility options to drop-down menu so they are read out aloud by screen reader
    const selectPlaceholder = document.querySelector(".Select-input");
    const selectInput = selectPlaceholder.firstElementChild;
    selectPlaceholder.setAttribute("id", "addressLbl");
    selectInput.setAttribute("aria-labelledby", "addressLbl");
  }

  render() {
    const { selectedOption } = this.state;
    const value = selectedOption && selectedOption.value;

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
            // Just return options unchanged
            return options;
          }}
          autoBlur={true}
          onBlurResetsInput={false}
          onCloseResetsInput={false}
          placeholder="Enter LGA, postcode or address"
          optionRenderer={this.renderOption}
        />
      </div>,
      document.querySelector(".addressinput")
    );
  }
}

module.exports = LgaSearch;
