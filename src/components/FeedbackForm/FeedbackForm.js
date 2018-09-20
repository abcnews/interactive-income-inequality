const React = require("react");
const styles = require("./FeedbackForm.scss");

class FeedbackForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = { feedbackText: "", submitted: false };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event) {
    this.setState({ feedbackText: event.target.value }, () => {
      //console.log(this.state.value);
    });
  }

  handleSubmit(event) {
    console.log(this.state.feedbackText);
    // Send feedback if logging is turned on
    if (
      sessionStorage &&
      sessionStorage.loggingLevel &&
      sessionStorage.loggingLevel !== "0"
    ) {
      ABC.News.trackEvent({
        category: "userFeedback",
        action: this.state.feedbackText
          ? this.state.feedbackText
          : "FIELD LEFT EMPTY BY USER",
        label: "storyLabIncome",
        value: this.state.feedbackText ? 1 : -1
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
            value={this.state.feedbackText}
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
