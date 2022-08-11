require('regenerator-runtime/runtime'); // for async/await to work
const React = require('react');
const { render } = require('react-dom');
// const xhr = require("xhr");
const spanify = require('spanify');
const gemini = require('@abcnews/gemini');

import { isMount, getMountValue, selectMounts } from '@abcnews/mount-utils';

// Directly pull in some code
// require('react-select/dist/react-select.css');
require('./lib/modernizr.js'); // Detect browser features

const PROJECT_NAME = 'incomecomparisons';

function init() {
  const root = document.querySelector(`#data${PROJECT_NAME}root`);
  // Turn CoreMedia span anchors into span tags
  // spanify.spanify();

  // spanify.hashify({
  //   hashList: [
  //     "addressinput",
  //     "incomeinput",
  //     "dumbbelltop",
  //     "dumbbelluser",
  //     "dumbbelleducation",
  //     "dumbbellgender",
  //     "dumbbellindigenous",
  //     "dumbbellborn",
  //     "dumbbellvoluntary",
  //     "dumbbellcar",
  //     "dumbbellmarriage",
  //     "dumbbellcontmarriage",
  //   ],
  // }); // Turn anchor hash tags into divs

  // Add class via CoreMedia hashtags eg. #classverytop
  function hashNext(targetString = 'class') {
    // Set deafult for params
    // if (targetString === undefined) {
    //   targetString = 'class';
    // }

    const mounts = selectMounts(targetString);

    // Loop through mounts
    mounts.forEach(mount => {
      // Leave normal links on the page alone
      // if (anchor.innerHTML !== ' ') return;

      // // Get name value
      // const elementName = anchor.getAttribute('name');

      const mountName = getMountValue(mount);

      // Detect targetString is the same
      if (mountName.slice(0, targetString.length) !== targetString) return;

      // Get class name to apply
      const classToApply = mountName.substring(targetString.length);

      // Get the next paragraph to work with
      const nextElement = mount.nextElementSibling;

      // Apply the class
      nextElement.classList.add(classToApply);
    });

    // const anchors = document.querySelectorAll('a');

    // // Loop through all the anchor nodes
    // anchors.forEach(anchor => {
    //   // Leave normal links on the page alone
    //   if (anchor.innerHTML !== ' ') return;

    //   // Get name value
    //   const elementName = anchor.getAttribute('name');

    //   // Detect class
    //   if (elementName.slice(0, targetString.length) !== targetString) return;

    //   // Get class name to apply
    //   const classToApply = elementName.substr(targetString.length);

    //   // Get the next paragraph to work with
    //   const nextElement = anchor.nextElementSibling;

    //   // Apply the class
    //   nextElement.classList.add(classToApply);
    // });
  }

  hashNext();

  if (typeof Storage !== 'undefined') {
    sessionStorage.setItem('loggingLevel', '1');
  } else {
    console.log('No session storage detected...');
  }

  const App = require('./components/App/App');

  render(<App projectName={PROJECT_NAME} />, root);
}

// Wait for Odyssey
if (window.__ODYSSEY__) {
  // gemini.fullReplace(init);
  init();
} else {
  window.addEventListener('odyssey:api', () => {
    // gemini.fullReplace(init);
    init();
  });
}

if (module.hot) {
  module.hot.accept('./components/App/App', () => {
    try {
      init();
    } catch (err) {
      const ErrorBox = require('./components/ErrorBox/ErrorBox');
      render(<ErrorBox error={err} />, root);
    }
  });
}

if (process.env.NODE_ENV === 'development') {
  console.debug(`[${PROJECT_NAME}] public path: ${__webpack_public_path__}`);
}
