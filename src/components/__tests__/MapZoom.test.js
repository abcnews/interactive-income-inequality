const React = require('react');
const renderer = require('react-test-renderer');

const MapZoom = require('../MapZoom');

describe('MapZoom', () => {
  test('It renders', () => {
    const component = renderer.create(<MapZoom />);

    let tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});
