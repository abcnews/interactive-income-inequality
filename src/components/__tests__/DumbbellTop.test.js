const React = require('react');
const renderer = require('react-test-renderer');

const DumbbellTop = require('../DumbbellTop');

describe('DumbbellTop', () => {
  test('It renders', () => {
    const component = renderer.create(<DumbbellTop />);

    let tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});
