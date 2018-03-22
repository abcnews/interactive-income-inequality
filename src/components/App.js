const React = require("react");
const styles = require("./App.scss");

// External modules
const d3Q = require("d3-queue");
const d3Request = require("d3-request");
const inside = require("point-in-polygon");
const topojson = require("topojson");
const MapboxClient = require("mapbox");

// Other React components
const LgaSearch = require("./LgaSearch");
const IncomeInput = require("./IncomeInput");
const MapScroller = require("./MapScroller");

let LGA_GEO_JSON_URL =
  // "http://WS204914.aus.aunty.abc.net.au:8000/LGA_2016_AUST_MAP.topo.json";
"http://www.abc.net.au/res/sites/news-projects/income-comparisons-react/master/LGA_2016_AUST_MAP.topo.json";

// Configuration
const config = {
  mapbox_token:
    "cGsuZXlKMUlqb2libVYzY3kxdmJqRnBibVVpTENKaElqb2lZMnBqYXpFM09UbDNNRFV5ZVRKM2NHbDJOV1J4Y0RocE55SjkuS3c0bGhBYkxVazlJUGF6dXRCZTI4dw=="
};

// Constants
const MAPBOX_TOKEN = atob(config.mapbox_token);

// File scope variables
let searchLongLat = [0, 0];
let LGAs = [];

// Initialise Mapbox
const client = new MapboxClient(MAPBOX_TOKEN);

// React app starts here
class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      localGovernmentArea: "Search Local Governments by address",
      mapData: null
    };
  }

  async addressToLGA(address, localAreas) {
    if (!address) return;

    // GET data from the MapBox API to get LongLat of an address string
    const returnedData = await client
      .geocodeForward(address, { test: "test" })
      .catch(error => console.log("An error occurred with MapBox... ", error));

    console.log(returnedData);

    // Handle some errors
    if (returnedData.entity.message === "Not Found") return;

    if (returnedData && returnedData.entity.features.length === 0) {
      console.log("Address not found...");
      return;
    }

    // Get center of searched address
    searchLongLat = returnedData.entity.features[0].center;

    let showLGA;

    // Loop through all Local Government Areas
    // TODO: maybe make this a separate function
    localAreas.forEach(LGA => {
      let currentLGA = LGA.geometry;

      if (currentLGA && currentLGA.type === "Polygon") {
        // Handle Polygon geometry types
        if (inside(searchLongLat, currentLGA.coordinates[0])) {
          showLGA = LGA.properties.LGA_NAME16;
        }
      } else if (currentLGA && currentLGA.type === "MultiPolygon") {
        // Handle MultiPolygon geometry type
        currentLGA.coordinates.forEach(polygon => {
          if (inside(searchLongLat, polygon[0])) {
            showLGA = LGA.properties.LGA_NAME16;
          }
        });
      }
    });

    this.setState((prevState, props) => ({
      localGovernmentArea: showLGA
    }));
  }

  componentWillMount() {
    // Queue up some files to be loaded
    d3Q
      .queue(1) // Concurrent requests
      .defer(d3Request.json, LGA_GEO_JSON_URL)
      .awaitAll((error, files) => {
        // Once all is loaded do this
        if (error) console.error(error);

        const LGAMap = files[0]; // Load the first file

        // Convert TopoJSON into GeoJSON
        const topology = topojson.feature(LGAMap, LGAMap.objects.LGA_2016_AUST); //aus_lga);

        LGAs = topology.features;

        this.setState({ mapData: LGAMap });

        console.log("External data loaded...");
      });
  }

  componentDidMount() {}

  handleLocaleIntent(addressString) {
    this.addressToLGA(addressString, LGAs);
  }

  render() {
    const { scrollyteller } = this.props;

    return (
      <div className={styles.root}>
        <IncomeInput />
        <LgaSearch
          onLocaleIntent={this.handleLocaleIntent.bind(this)}
          localGovernmentArea={this.state.localGovernmentArea}
        />
        {/* Conditionally render MapScroller if data loaded */}
        {this.state.mapData ? (
          <MapScroller
            scrollyteller={scrollyteller}
            mapData={this.state.mapData}
          />
        ) : (
          <div />
        )}
      </div>
    );
  }
}

module.exports = App;
