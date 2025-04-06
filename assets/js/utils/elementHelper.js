/**
 * Function that returns the correct HTML element
 * @template {keyof HTMLElementTagNameMap} T
 * @param {string} id - id or query of the element
 * @param {T} type - type of HTML element
 * @param {boolean} [isQuery=false] - use true for querySelector
 * @returns {HTMLElementTagNameMap[type]}
 */
export function getElement(id, type, isQuery = false) {
  const el = isQuery
    ? /**@type {HTMLElementTagNameMap[type]}*/(document.querySelector(id))
    : /**@type {HTMLElementTagNameMap[type]}*/(document.getElementById(id));

  if (!el) {
    console.error(`Missing HTML <${type}> with id ${id}`);
    alert(`Missing HTML <${type}> with id ${id}`);
  }

  const expectedType = document.createElement(type).constructor.name;
  const actualType =  el.constructor.name;

  if (expectedType !== actualType) {
    console.error(`HTML tag mismatch! Expected <${expectedType}> but got <${actualType}>`);
    alert("HTML tag mismatch! check the console");
  }

  return el;
}

export const resultDisplayEl = getElement("searchResultsContainer", "section");
export const landingPageEl = getElement("landingPage", "section");

// modal elements
export const myModalEl = getElement('staticBackdrop', "div");
export const modalContentEl = getElement('.modal-content', "div", true);
export const modalHeaderEl = getElement(".modal-header h2", "h2", true);
export const modalTextEl = getElement(".modal-body > p", "p", true);
export const modalListEl = getElement("thumbList", "ul");
