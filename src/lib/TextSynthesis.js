/** @typedef {import('../types').ITextSynthesisDictionary} ITextSynthesisDictionary */

/**
 * A class that is responsible for preparing the text to be read by the TTS.
 */
export class TextSynthesis {
  /**
   * The initial value.
   * @type {string}
   */
  value;

  /**
   * @type {ITextSynthesisDictionary}
   */
  dictionary = {
    quot: `"`,
    quest: `?`,
    tagStart: '<',
    tagEnd: '>',
    threeDots: '...',
  }

  /**
   * @param {string} value The text to prepare
   * @param {ITextSynthesisDictionary=} dictionary Optional dictionary to use. If not set, defaults to english.
   */
  constructor(value, dictionary) {
    this.value = value;
    if (dictionary) {
      this.dictionary = dictionary;
    }
  }

  /**
   * Parses the text and prepares it for reading.
   * @returns {string}
   */
  translate() {
    let txt = this.value;
    txt = this._replaceThreeDots(txt);
    txt = this._prepareDictionary(txt);
    return txt;
  }

  /**
   * Replaces the '...' characters with a word.
   * @param {string} value 
   * @returns {string}
   */
  _replaceThreeDots(value) {
    const { dictionary } = this;
    return value.replaceAll('...', ` ${dictionary.threeDots} `);
  }

  /**
   * Translates the dictionary words and all the "." and "," characters 
   * that are not at the end of sentence to the corresponding words.
   * 
   * @param {string} value 
   * @returns {string}
   */
  _prepareDictionary(value) {
    const { dictionary } = this;
    return value.replaceAll(/[<>?"—]/g, (substring) => {
      if (substring === '<') {
        return dictionary.tagStart;
      }
      if (substring === '>') {
        return dictionary.tagEnd;
      }
      if (substring === '?') {
        return dictionary.quest;
      }
      if (substring === '"') {
        return dictionary.quot;
      }
      if (substring === '—') {
        return '-';
      }
      return substring;
    });
  }
}
