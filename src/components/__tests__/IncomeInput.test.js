const React = require('react');
const renderer = require('react-test-renderer');

const IncomeInput = require('../IncomeInput');

describe('IncomeInput', () => {
  test('It renders', () => {
    const component = renderer.create(<IncomeInput />);

    let tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});
