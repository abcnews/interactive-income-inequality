const React = require('react');
const renderer = require('react-test-renderer');

const FeedbackForm = require('./FeedbackForm');

describe('FeedbackForm', () => {
  test('It renders', () => {
    const component = renderer.create(<FeedbackForm />);

    let tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});
