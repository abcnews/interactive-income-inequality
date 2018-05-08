const React = require("react");
const { render } = require("react-dom");
const spanify = require("spanify");

require("react-select/dist/react-select.css");

require("./lib/modernizr.js"); // Detect browser features

const PROJECT_NAME = "income-comparisons";
require("babel-polyfill"); // for async/await to work

const root = document.querySelector(`[data-${PROJECT_NAME}-root]`);

// const scrollyteller = require("@abcnews/scrollyteller").loadOdysseyScrollyteller(
//   "",
//   "u-full",
//   "mark"
// );

function init() {
  spanify.hashify({
    hashList: [
      "addressinput",
      "incomeinput",
      "dumbbelltop",
      "dumbbelluser",
      "dumbbelleducation",
      "dumbbellgender",
      "dumbbellindigenous",
      "dumbbellborn",
      "dumbbellvoluntary",
      "dumbbellcar",
      "dumbbellmarriage",
      "dumbbellcontmarriage"
    ]
  }); // Turn anchor hash tags into divs

  const App = require("./components/App/App");

  render(
    <App
      projectName={PROJECT_NAME}
      // scrollyteller={scrollyteller}
    />,
    root
  );
}

init();

if (module.hot) {
  module.hot.accept("./components/App/App", () => {
    try {
      init();
    } catch (err) {
      const ErrorBox = require("./components/ErrorBox/ErrorBox");
      render(<ErrorBox error={err} />, root);
    }
  });
}

if (process.env.NODE_ENV === "development") {
  console.debug(`[${PROJECT_NAME}] public path: ${__webpack_public_path__}`);
}
