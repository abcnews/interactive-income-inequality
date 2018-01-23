const { h } = require('preact');
const render = require('preact-render-to-string');
const htmlLooksLike = require('html-looks-like');

const IncomeInput = require('../IncomeInput');

describe('IncomeInput', () => {
  test('It renders', () => {
    const actual = render(<IncomeInput />);
    const expected = `
      <div>
        Find me in {{ ... }}
      </div>
    `;

    htmlLooksLike(actual, expected);
  });
});
