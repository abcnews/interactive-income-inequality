const React = require('react');
const renderer = require('react-test-renderer');

const DumbBellUser = require('../DumbbellUser');

describe('DumbbellUser', () => {
  test('It renders', () => {
    const component = renderer.create(<DumbbellUser />);

    let tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});
