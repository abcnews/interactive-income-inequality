const React = require('react');
const renderer = require('react-test-renderer');

const DumbbellIndigenou = require('../DumbbellIndigenou');

describe('DumbbellIndigenou', () => {
  test('It renders', () => {
    const component = renderer.create(<DumbbellIndigenou />);

    let tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});
