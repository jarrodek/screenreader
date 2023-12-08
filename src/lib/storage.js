class Storage {
  /**
   * Checks whether the user enabled the extension, meaning,
   * it should tts selected text.
   *
   * @returns {boolean} True if the extension is active.
   */
  async isActive() {
    const result = await chrome.storage.sync.get({ active: true });
    const active = result.active;
    return active;
  }

  /**
   * Restores saved or creates new TTS options
   * @returns {Promise<chrome.tts.SpeakOptions>}
   */
  async getTtsOptions() {
    const defaults = /** @type {chrome.tts.SpeakOptions} */ ({
      enqueue: false,
      rate: 1.0,
      pitch: 1.0,
      volume: 1.0,
      voiceName: null,
    });
    const options = /** @type {chrome.tts.SpeakOptions} */ (
      await chrome.storage.sync.get(defaults)
    );
    return options;
  }

  /**
   * Stores a single value in the sync store.
   * @param {string} key The key under which to store option
   * @param {unknown} value The value to store.
   */
  async saveTtsOption(key, value) {
    const save = {};
    save[key] = value;
    await chrome.storage.sync.set(save);
  }
}

const instance = new Storage();
export default instance;
