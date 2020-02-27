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
    this.setState({ feedbackText: event.target.value }, () => {});
  }

  handleSubmit(event) {
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
