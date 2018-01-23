const { h } = require('preact');
const render = require('preact-render-to-string');
const htmlLooksLike = require('html-looks-like');

const LgaSearch = require('../LgaSearch');

describe('LgaSearch', () => {
  test('It renders', () => {
    const actual = render(<LgaSearch />);
    const expected = `
      <div>
        Find me in {{ ... }}
      </div>
    `;

    htmlLooksLike(actual, expected);
  });
});
