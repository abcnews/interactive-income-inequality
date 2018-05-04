const React = require('react');
const renderer = require('react-test-renderer');

const DumbbellCar = require('../DumbbellCar');

describe('DumbbellCar', () => {
  test('It renders', () => {
    const component = renderer.create(<DumbbellCar />);

    let tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});
