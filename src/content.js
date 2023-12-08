/** @typedef {import('./types').IWorkerMessage} IWorkerMessage */

/**
 * The main script that runs the extension in the context of the current page.
 * It loads dependency files defined in the `web_accessible_resources` entry of the manifest.
 * Since content script cannot use the `import xxx from yyyy` these dependencies
 * have to be listed in the `web_accessible_resources` entry and manually included.
 * 
 * Each of these scripts are responsible for different logic of the extension.
 * This class' logic proxies user interactions to these scripts.
 */
class ScreenReaderContentScript {
  /**
   * A reference to the TTS logic.
   * Loaded after the content script is loaded, during the initialization.
   */
  audio = null;

  /**
   * A reference to the image/video processing logic.
   * Loaded after the content script is loaded, during the initialization.
   */
  video = null;

  constructor() {
    this.handleMouseOver = this.handleMouseOver.bind(this);
    this.handleMouseOut = this.handleMouseOut.bind(this);
    this.handleMouseClick = this.handleMouseClick.bind(this);
    this.messageHandler = this.messageHandler.bind(this);
  }

  /**
   * Initializes the content script.
   * Adds relevant event listeners to the `window` object.
   */
  async init() {
    const audioSrc = chrome.runtime.getURL("/src/content/audio.js");
    const videoSrc = chrome.runtime.getURL("/src/content/video.js");

    const AudioContentScript = await import(audioSrc);
    const VideoContentScript = await import(videoSrc);
    this.audio = new AudioContentScript.default();
    this.video = new VideoContentScript.default();
    this.connect();
    chrome.runtime.onMessage.addListener(this.messageHandler);
  }

  /**
   * This happens after the extension was updated or removed.
   */
  handleExtensionBroken() {
    chrome.runtime.onMessage.removeListener(this.messageHandler);
    this.disconnect();
  }

  /**
   * Attaches events listeners.
   */
  connect() {
    window.addEventListener("mouseover", this.handleMouseOver);
    window.addEventListener("mouseout", this.handleMouseOut);
    window.addEventListener("click", this.handleMouseClick);
  }

  /**
   * Cleans up when the content scrip is removed.
   * Removes previously attached event listeners and cleans up any references made.
   */
  disconnect() {
    window.removeEventListener("mouseover", this.handleMouseOver);
    window.removeEventListener("mouseout", this.handleMouseOut);
    window.removeEventListener("click", this.handleMouseClick);
    this.audio.disconnect();
    this.video.disconnect();
  }

  /**
   * @returns {boolean} True when the event page is no longer accessible.
   */
  isShutDown() {
    let result = false;
    try {
      const { id } = chrome.runtime;
      result = !(typeof id === 'string');
    } catch (e) {
      result = true;
    }
    return result;
  }

  /**
   * Handles the mouseover event.
   *
   * @param {PointerEvent} e
   */
  handleMouseOver(e) {
    if (this.isShutDown()) {
      this.handleExtensionBroken();
      return;
    }
    this.audio.handleMouseOver(e);
    this.video.handleMouseOver(e);
  }

  /**
   * Handles the mouseout event.
   *
   * @param {PointerEvent} e
   */
  handleMouseOut(e) {
    if (this.isShutDown()) {
      this.handleExtensionBroken();
      return;
    }
    this.audio.handleMouseOut(e);
    this.video.handleMouseOut(e);
  }

  /**
   * Handles the click event.
   *
   * @param {PointerEvent} e
   */
  handleMouseClick(e) {
    if (this.isShutDown()) {
      this.handleExtensionBroken();
      return;
    }
    this.audio.handleMouseClick(e);
  }

  /**
   * A handler for messages from the worker script.
   * @param {IWorkerMessage} message
   * @returns {void}
   */
  messageHandler(message) {
    const { type } = message;
    switch (type) {
      case 'unload': this.disconnect(); break;
      case 'load': this.connect(); break;
    }
  }
}
const instance = new ScreenReaderContentScript();
instance.init();
