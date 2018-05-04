const React = require('react');
const renderer = require('react-test-renderer');

const DumbbellBorn = require('../DumbbellBorn');

describe('DumbbellBorn', () => {
  test('It renders', () => {
    const component = renderer.create(<DumbbellBorn />);

    let tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});
