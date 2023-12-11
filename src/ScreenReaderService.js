import { TextSynthesis } from "./lib/TextSynthesis.js";
import storage from "./lib/storage.js";
import adjustImage from './actions/ImageContrast.js';

/** @typedef {import('./types').IWorkerMessage} IWorkerMessage */
/** @typedef {import('./types').IContentMessage} IContentMessage */
/** @typedef {import('./types').ITextSynthesisDictionary} ITextSynthesisDictionary */

export class ScreenReaderService {
  /**
   * @param {(response?: any) => void} sendResponseFunction
   */
  constructor(sendResponseFunction) {
    /** @type {(response?: any) => void} */
    this.sendResponse = sendResponseFunction;
  }

  /**
   * Handles a message from the content script.
   * @param {IContentMessage} message
   */
  async handleMessage(message) {
    if (!message || !message.type) {
      return;
    }
    if (message.type === "play") {
      const text = /** @type {string | undefined} */ (message.data);
      if (!text) {
        // log?
        return;
      }
      this.play(text);
    } else if (message.type === 'image') {
      const url = /** @type {string | undefined} */ (message.data);
      if (!url) {
        // log?
        return;
      }
      this.processImage(url);
    } else if (message.type === 'list-voices') {
      const result = await chrome.tts.getVoices();
      this.sendResponse(result);
    }
  }

  /**
   * Playbacks the `text` using the Chrome's TTS.
   * @param {string} text The text to play using the built-in TTS.
   */
  async play(text) {
    const active = await storage.isActive();
    if (!active) {
      return;
    }
    const speaking = await chrome.tts.isSpeaking();
    if (speaking) {
      await chrome.tts.stop();
    }
    const options = await storage.getTtsOptions();
    const message = this.prepareText(text);
    const parts = this.sentencesGenerator(message);
    for (const part of parts) {
      if (!part) {
        continue;
      }
      try {
        await chrome.tts.speak(part, { ...options, enqueue: true });
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log('[TTS Error]', e);
      }
    }
    this.sendResponse();
  }

  /**
   * Prepares a text to be read by the TTS engine.
   *
   * It will replace special characters like "$", "£" or "?" to its equivalent
   * understandable by the tts engine.
   *
   * @param {string} txt The text to be prepared.
   * @returns {string} The formatted for the TTS text.
   */
  prepareText(txt) {
    const tokens = this.getDictionary();
    const factory = new TextSynthesis(txt, tokens);
    return factory.translate();
  }

  /**
   * @returns {ITextSynthesisDictionary}
   */
  getDictionary() {
    const { getMessage } = chrome.i18n;
    return {
      quot: getMessage("QUOT_MARK"),
      quest: getMessage("QUEST_MARK"),
      tagStart: getMessage("TAG_START"),
      tagEnd: getMessage("TAG_END"),
      threeDots: getMessage("THREE_DOTS"),
    };
  }

  /**
   * Prepares a text to be read in sentences.
   *
   * Chrome tts engine has 32,768 character limit. After reaching this limit
   * the msg will be splitted.
   *
   * The split point will occur after the last ".", before the character limit.
   *
   * @param {string} paragraph The message to split into sentences.
   * @returns {Generator<string>}
   */
  *sentencesGenerator(paragraph) {
    const maxCharacters = 240; // 32768;

    let txt = paragraph;

    while (txt) {
      let part = txt.substring(0, maxCharacters);
      txt = txt.substring(maxCharacters);
      if (!txt.trim()) {
        // no more text anyway so no bother checking.
        yield part;
        return;
      }
      if (part.trim().endsWith('.')) {
        // ideal match
        yield part;
        continue;
      }
      // from the end of the part we move back to the one of the following (in order) 
      // - period 
      // - coma
      // - hyphen
      // - space
      // We subtract what's after and return it to the stack (the txt).
      let index = part.lastIndexOf('.');
      if (index === -1) {
        index = part.lastIndexOf(',');
        if (index === -1) {
          index = part.lastIndexOf('-');
          if (index === -1) {
            index = part.lastIndexOf(' ');
          }
        }
      }
      if (index === -1) {
        // nothing we can do...
        yield part;
        continue;
      }
      index += 1;
      const returnStack = part.substring(index);
      part = part.substring(0, index);
      txt = `${returnStack}${txt}`;
      yield part.trim();
    }
  }

  /**
   * Adjust brightness and contrast of an image.
   * @param {string} url The URL of the image to process.
   */
  async processImage(url) {
    const active = await storage.isActive();
    if (!active) {
      return;
    }
    const result = await adjustImage(url);
    this.sendResponse(result);
  }
}
