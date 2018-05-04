const React = require('react');
const renderer = require('react-test-renderer');

const DumbbellGender = require('../DumbbellGender');

describe('DumbbellGender', () => {
  test('It renders', () => {
    const component = renderer.create(<DumbbellGender />);

    let tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});
