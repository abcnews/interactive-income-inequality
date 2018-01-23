const React = require('react');
const renderer = require('react-test-renderer');

const LgaSearch = require('../LgaSearch');

describe('LgaSearch', () => {
  test('It renders', () => {
    const component = renderer.create(<LgaSearch />);

    let tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});
