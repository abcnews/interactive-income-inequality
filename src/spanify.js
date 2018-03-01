// Pollyfill for IE11 forEach through browser node arrays
if (window.NodeList && !NodeList.prototype.forEach) {
  NodeList.prototype.forEach = function(callback, thisArg) {
    thisArg = thisArg || window;
    for (var i = 0; i < this.length; i++) {
      callback.call(thisArg, this[i], i, this);
    }
  };
}

// Scans DOM for <a title="whatever"> </a> some text <a title="end"> </a>
// and converts to <span class="whatever">some text</span>
export function spanify(options) {
  // Get an array of all the anchor elements on the page
  const anchors = document.querySelectorAll("a");

  // Loop through all the anchor nodes
  anchors.forEach(anchor => {
    // Leave normal links on the page alone
    if (anchor.innerHTML !== " ") return;
    // Leave #hashtag links alone
    if (!anchor.getAttribute("title")) return;

    // The anchor title will later become the span class
    const elementTitle = anchor.getAttribute("title");

    // If it is an "end" tag it will already have made the span
    if (elementTitle.slice(0, 3) === "end") {
      // So we don't need it any more...
      anchor.parentNode.removeChild(anchor);
      return;
    }

    // Compose our span element
    const spanEl = document.createElement("span");
    spanEl.setAttribute("class", elementTitle);

    // Add a default class if passed one
    if (options && options.defaultClass) {
      addClass(spanEl, options.defaultClass);
    }

    if (
      anchor.nextElementSibling &&
      anchor.nextElementSibling.getAttribute("title").slice(0, 3) === "end"
    ) {
      // Store the text in between the two anchor tags
      const spanTextEl = anchor.nextSibling;
      spanEl.innerHTML = spanTextEl.textContent.trim();

      // To replace the anchor apparently the span needs to be appended
      anchor.parentNode.appendChild(spanEl);

      // Replace the first anchor tag
      anchor.parentNode.replaceChild(spanEl, anchor);
      // Remove the remaining in between text
      spanTextEl.parentNode.removeChild(spanTextEl);
    } else {
      // If single anchor without enclosing text simply convert directly
      anchor.parentNode.appendChild(spanEl);
      anchor.parentNode.replaceChild(spanEl, anchor);
    }
  });
}

// Scans DOM for <a name="whatever"> </a>
// and converts to <div class="whatever"></div>
export function hashify(options) {
  // Get an array of all the anchor elements on the page
  const anchors = document.querySelectorAll("a");

  // Loop through all the anchor nodes
  anchors.forEach(anchor => {
    // Leave normal links on the page alone
    if (anchor.innerHTML !== " ") return;
    // Leave #hashtag links alone
    if (anchor.getAttribute("title")) return;
    // Make sure it's really a #hashlink
    if (!anchor.getAttribute("name")) return;

    // Conditional transform of hashes
    if (options && options.hashList) {
      if (options.hashList.indexOf(anchor.getAttribute("name")) === -1) return;
    }

    // The anchor title will later become the span class
    const elementName = anchor.getAttribute("name");

    // Compose our new div element
    const divEl = document.createElement("div");
    divEl.setAttribute("class", elementName);

    // Add a default class if passed one
    if (options && options.defaultClass) {
      addClass(divEl, options.defaultClass);
    }

    // Replace anchor with div
    anchor.parentNode.replaceChild(divEl, anchor);
  });
}

// Some convenience methods
function addClass(el, className) {
  if (el.classList) el.classList.add(className);
  else if (!hasClass(el, className)) el.className += ` ${className}`;
}
