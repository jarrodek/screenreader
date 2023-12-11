/** @typedef {import('../types').IContentMessage} IContentMessage */

const NO_TEXT = "srNoText";
const NO_TEXT_ATT = "data-sr-no-text";
const HIGHLIGHT = "sr-highlight";

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
    this.processNodeHover(node);
  }

  /**
   * Adds the highlight class to elements that have text in it.
   * 
   * @param {HTMLElement} node 
   */
  processNodeHover(node) {
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
    this.processNodeOut(node);
  }

  /**
   * Removes the highlight class.
   * 
   * @param {HTMLElement} node 
   */
  processNodeOut(node) {
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
    const clone = this.prepareClone(node);
    const txt = this.getNodeText(clone).trim();
    if (txt === "") {
      return;
    }
    this.play(txt);
  }

  /**
   * Makes a usable for text extracting copy of a node.
   * It removes all not relevant children from the copy.
   * 
   * @param {Element} node 
   * @returns {Element}
   */
  prepareClone(node) {
    const clone = /** @type Element */ (node.cloneNode(true));
    const remove = Array.from(
      clone.querySelectorAll("script,style,img,object,embed,audio,video,svg")
    );
    remove.forEach((node) => {
      node.parentNode.removeChild(node);
    });
    return clone;
  }

  /**
   * Reads the text content of an element.
   * @param {ChildNode} element The element to read the text content from
   * @returns {string} The text content of the element.
   */
  getNodeText(element) {
    let result = '';
    if (element.childNodes.length > 0) {
      for (let i = 0; i < element.childNodes.length; i++) {
        const child = /** @type ChildNode */ (element.childNodes[i]);
        const value = this.getNodeText(child);
        if (value) {
          result += value + " ";
        }
      }
    }
    if (element.nodeType === Node.TEXT_NODE) {
      const value = element.nodeValue.trim();
      if (value) {
        result += value;
      }
    }
    return result.trim();
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
