/** @typedef {import('../types').IContentMessage} IContentMessage */

const NO_TEXT = "srNoText";
const NO_TEXT_ATT = "data-sr-no-text";
const HIGHLIGHT = "sr-highlight";
const CLICKED = "srClicked";

/**
 * The class that is responsible for managing text-to-speech on a web page.
 */
export default class AudioContentScript {
  /**
   * Lifecycle method when the content script is unloaded
   * for whatever reason (uninstall, extension reload, etc).
   * Cleans up any previously set state and restores any changes.
   */
  disconnect() {
    const highlighted = document.body.querySelectorAll(`.${HIGHLIGHT}`);
    for (const node of Array.from(highlighted)) {
      node.classList.remove(HIGHLIGHT);
    }
    const marked = document.body.querySelectorAll(`[${NO_TEXT_ATT}]`);
    for (const node of Array.from(marked)) {
      node.removeAttribute(NO_TEXT_ATT);
    }
  }

  /**
   * Handles the mouseover event.
   *
   * @param {PointerEvent} e
   */
  handleMouseOver(e) {
    const node = /** @type HTMLElement */ (e.target);
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return;
    }
    if (
      node.nodeName === "BODY" ||
      node.dataset[NO_TEXT] ||
      node.classList.contains(HIGHLIGHT)
    ) {
      return;
    }
    const txt = this.getNodeText(node).trim();
    if (!txt) {
      node.dataset[NO_TEXT] = "true";
    } else {
      node.classList.add(HIGHLIGHT);
    }
  }

  /**
   * Handles the mouseout event.
   *
   * @param {PointerEvent} e
   */
  handleMouseOut(e) {
    const node = /** @type HTMLElement */ (e.target);
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return;
    }
    if (node.classList.contains(HIGHLIGHT)) {
      node.classList.remove(HIGHLIGHT);
    }
  }

  /**
   * Handles the click event.
   *
   * @param {PointerEvent} e
   */
  handleMouseClick(e) {
    const node = /** @type HTMLElement */ (e.target);
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return;
    }
    if (!node.classList.contains(HIGHLIGHT)) {
      return;
    }
    if (!node.dataset[CLICKED]) {
      node.dataset[CLICKED] = "true";
      e.preventDefault();
      e.stopPropagation();
    }
    const clone = /** @type HTMLElement */ (node.cloneNode(true));
    const remove = Array.from(
      clone.querySelectorAll("script,style,img,object,embed,svg")
    );
    remove.forEach((node) => {
      node.parentNode.removeChild(node);
    });
    let txt = this.getNodeText(node).trim();
    txt = txt.replace(/[\s]{2,}/gi, " ").trim();
    if (txt === "") {
      return;
    }
    this.play(txt);
  }

  /**
   * Reads the text content of an element.
   * @param {HTMLElement} element The element to read the text content from
   * @returns {string} The text content of the element.
   */
  getNodeText(element) {
    let result = '';
    if (element.childNodes.length > 0) {
      for (let i = 0; i < element.childNodes.length; i++) {
        const child = /** @type HTMLElement */ (element.childNodes[i]);
        result += this.getNodeText(child) + " ";
      }
    }
    if (
      element.nodeType === Node.TEXT_NODE &&
      element.nodeValue.trim() !== ""
    ) {
      result += element.nodeValue.trim();
    }
    return result;
  }

  /**
   * Cancels the currently read text.
   */
  stop() {
    const message = /** @type IContentMessage */ ({
      type: 'stop',
    });
    chrome.runtime.sendMessage(message);
  }

  /**
   * Sends the message to the background page to read the text.
   * @param {string} msg The text to read.
   */
  play(msg) {
    const message = /** @type IContentMessage */ ({
      type: 'play',
      data: msg,
    });
    chrome.runtime.sendMessage(message);
  }
}
