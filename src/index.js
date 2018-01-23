const { h, render } = require("preact");
const spanify = require("spanify");

const PROJECT_NAME = "income-comparisons";
require("babel-polyfill"); // for async/await to work

const root = document.querySelector(`[data-${PROJECT_NAME}-root]`);

function init() {
  spanify.hashify(); // Turn anchor hash tags into divs
  const App = require("./components/App");
  render(<App projectName={PROJECT_NAME} />, root, root.firstChild);
}

init();

if (module.hot) {
  module.hot.accept("./components/App", () => {
    try {
      init();
    } catch (err) {
      const ErrorBox = require("./components/ErrorBox");
      render(<ErrorBox error={err} />, root, root.firstChild);
    }
  });
}

if (process.env.NODE_ENV === "development") {
  require("preact/devtools");
  console.debug(`[${PROJECT_NAME}] public path: ${__webpack_public_path__}`);
}
