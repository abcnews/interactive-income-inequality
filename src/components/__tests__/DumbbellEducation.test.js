const React = require('react');
const renderer = require('react-test-renderer');

const DumbbellEducation = require('../DumbbellEducation');

describe('DumbbellEducation', () => {
  test('It renders', () => {
    const component = renderer.create(<DumbbellEducation />);

    let tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});
