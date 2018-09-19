const React = require("react");
const styles = require("./FeedbackForm.scss");

class FeedbackForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = { value: "", submitted: false };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event) {
    this.setState({ value: event.target.value }, () => {
      console.log(this.state.value);
    });
  }

  handleSubmit(event) {
    // Send feedback if logging is turned on
    if (
      sessionStorage &&
      sessionStorage.loggingLevel &&
      sessionStorage.loggingLevel !== "0"
    ) {
      ABC.News.trackEvent({
        category: "News Story Lab Data",
        action: "{ feedback: " + this.state.value + "}",
        label: "Income Inequality: Result feedback",
        value: 1
      });
    }

    this.setState({ submitted: true });

    event.preventDefault();
  }

  render() {
    return (
      <div className={styles.wrapper}>
        <form onSubmit={this.handleSubmit}>
          <label />
          <input
            className={styles.textBox}
            type="text"
            value={this.state.value}
            onChange={this.handleChange}
            disabled={this.state.submitted}
          />
          <input
            className={styles.submitButton}
            type="submit"
            value={this.state.submitted ? "Thanks" : "Submit"}
            disabled={this.state.submitted}
          />
        </form>
      </div>
    );
  }
}

module.exports = FeedbackForm;
