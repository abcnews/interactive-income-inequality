const React = require('react');
const renderer = require('react-test-renderer');

const DumbbellVoluntary = require('../DumbbellVoluntary');

describe('DumbbellVoluntary', () => {
  test('It renders', () => {
    const component = renderer.create(<DumbbellVoluntary />);

    let tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});
