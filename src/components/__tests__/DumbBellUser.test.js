const React = require('react');
const renderer = require('react-test-renderer');

const DumbBellUser = require('../DumbBellUser');

describe('DumbBellUser', () => {
  test('It renders', () => {
    const component = renderer.create(<DumbBellUser />);

    let tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});
