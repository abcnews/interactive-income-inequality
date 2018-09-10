const React = require("react");
const { render } = require("react-dom");
const xhr = require("xhr");
const spanify = require("spanify");

import * as gemini from "@abcnews/gemini";

// const gemini = require("@abcnews/gemini");

require("react-select/dist/react-select.css");

require("./lib/modernizr.js"); // Detect browser features

const PROJECT_NAME = "income-comparisons";
require("babel-polyfill"); // for async/await to work

const root = document.querySelector(`[data-${PROJECT_NAME}-root]`);

function init() {
  // Turn CoreMedia span anchors into span tags
  spanify.spanify();

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

  // Re-apply smart quotes to main content
  window.__ODYSSEY__.utils.misc.smartquotes(document.getElementById("main_content"));

  const App = require("./components/App/App");

  render(<App projectName={PROJECT_NAME} />, root);
}

// // Set up a twin dynamic content article
// const getSupplementaryCMID = () => {
//   const SUPPLEMENTARY_CMID_META_SELECTOR = 'meta[name="supplementary"]';
//   const metaEl = document.querySelector(SUPPLEMENTARY_CMID_META_SELECTOR);

//   if (!metaEl) {
//     throw new Error(`${SUPPLEMENTARY_CMID_META_SELECTOR} does not exist`);
//   }

//   let cmid = metaEl.getAttribute("content");

//   if (cmid.indexOf("CMArticle") > -1) {
//     cmid = cmid.match(/id=(\d+)/)[1];
//   }

//   if (cmid != +cmid) {
//     throw new Error(`"${cmid}" does not look like a CMID`);
//   }

//   return cmid;
// };

// // Fetch another CoreMedia article and parse it for dynamic use
// xhr({ url: "/news/" + getSupplementaryCMID() }, (err, response, body) => {
//   function transform() {
//     const doc = new DOMParser().parseFromString(body, "text/html");
//     const startNode = doc.querySelector('a[name="content"]');
//     const endNode = doc.querySelector('a[name="endcontent"]');

//     if (!startNode || !endNode) {
//       console.error(new Error("No content bookends found in document."));

//       return init();
//     }

//     let currentNode = startNode;
//     const injectionRoot = document.querySelector('[name="fullscript"]');

//     let fetchedNodes = [];

//     while (
//       ((currentNode = currentNode.nextSibling),
//       currentNode && currentNode !== endNode)
//     ) {
//       fetchedNodes.push(currentNode);
//     }

//     fetchedNodes.forEach(node => {
//       // Use Odyssey API to re-apply smart quotes
//       window.__ODYSSEY__.utils.misc.smartquotes(node);

//       // Append fetched content
//       injectionRoot.appendChild(node);
//     });

//     // Unwraps injected content from parent
//     var parent = injectionRoot.parentNode;
//     while (injectionRoot.firstChild)
//       parent.insertBefore(injectionRoot.firstChild, injectionRoot);
//     parent.removeChild(injectionRoot);

//     init();
//   }

//   // Wait for Odyssey
//   if (window.__ODYSSEY__) {
//     transform();
//   } else {
//     window.addEventListener("odyssey:api", transform);
//   }
// });

// Wait for Odyssey
if (window.__ODYSSEY__) {
  console.log(gemini)
  gemini.fullReplace(init);
} else {
  window.addEventListener("odyssey:api", () => {
    gemini.fullReplace(init);
  });
}

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
