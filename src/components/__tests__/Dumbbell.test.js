const React = require('react');
const renderer = require('react-test-renderer');

const Dumbbell = require('../Dumbbell');

describe('Dumbbell', () => {
  test('It renders', () => {
    const component = renderer.create(<Dumbbell />);

    let tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});
