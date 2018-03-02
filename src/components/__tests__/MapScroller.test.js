const React = require('react');
const renderer = require('react-test-renderer');

const MapScroller = require('../MapScroller');

describe('MapScroller', () => {
  test('It renders', () => {
    const component = renderer.create(<MapScroller />);

    let tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});
