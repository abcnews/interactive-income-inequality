const React = require('react');
const renderer = require('react-test-renderer');

const IncomeResult = require('../IncomeResult');

describe('IncomeResult', () => {
  test('It renders', () => {
    const component = renderer.create(<IncomeResult />);

    let tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});
