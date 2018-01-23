const { h, Component } = require("preact");

const styles = require("./LgaSearch.scss");

class LgaSearch extends Component {
  constructor(props) {
    super(props);

    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleSubmit(event) {
    event.preventDefault();
    // console.log(event.target["0"].value);
    this.props.onLocaleIntent(event.target["0"].value);
  }

  render() {
    return (
      <div className={styles.wrapper}>
        <form onSubmit={this.handleSubmit}>
          <input />
        </form>
        <div>{this.props.localGovernmentArea}</div>
      </div>
    );
  }
}

module.exports = LgaSearch;
