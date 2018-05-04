const React = require('react');
const renderer = require('react-test-renderer');

const DumbbellMarriage = require('../DumbbellMarriage');

describe('DumbbellMarriage', () => {
  test('It renders', () => {
    const component = renderer.create(<DumbbellMarriage />);

    let tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});
