const React = require('react');
const renderer = require('react-test-renderer');

const DumbbellContMarriage = require('../DumbbellContMarriage');

describe('DumbbellContMarriage', () => {
  test('It renders', () => {
    const component = renderer.create(<DumbbellContMarriage />);

    let tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});
