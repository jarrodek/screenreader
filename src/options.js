import storage from './lib/storage.js';
import { ButtonSwitch } from './lib/SwitchButton.js';

/** @typedef {import('./types').IContentMessage} IContentMessage */

class OptionsPage {

  /**
   * @returns {HTMLSelectElement}
   */
  get voiceInput() {
    return document.querySelector('#voice');
  }

  /**
   * @returns {HTMLInputElement}
   */
  get rateInput() {
    return document.querySelector('#rate');
  }

  /**
   * @returns {HTMLInputElement}
   */
  get pitchInput() {
    return document.querySelector('#pitch');
  }

  /**
   * @returns {HTMLInputElement}
   */
  get volumeInput() {
    return document.querySelector('#volume');
  }

  /**
   * @returns {HTMLButtonElement}
   */
  get mainToggleSwitch() {
    return document.querySelector('#mainToggle');
  }

  /**
   * The list of supported voices.
   * @type {chrome.tts.TtsVoice[]}
   */
  voices = [];

  constructor() {
    this.handleInput = this.handleInput.bind(this);
    this.handleSelect = this.handleSelect.bind(this);
    this.handleTest = this.handleTest.bind(this);
  }

  async initialize() {
    this.voices = await this.listVoices();
    this.renderVoices();
    await this.restoreValues();
    this.listen();
    new ButtonSwitch(this.mainToggleSwitch);
  }

  /**
   * @returns {Promise<chrome.tts.TtsVoice[]>}
   */
  listVoices() {
    const message = /** @type IContentMessage */ ({
      type: 'list-voices',
    });
    return chrome.runtime.sendMessage(message);
  }

  renderVoices() {
    const { voices } = this;
    const fragment = document.createDocumentFragment();
    for (const item of voices) {
      const { voiceName } = item;
      const opt = document.createElement('option');
      opt.value = voiceName;
      opt.text = voiceName;
      fragment.appendChild(opt);
    }
    const sel = document.querySelector('#voice');
    sel.children[0].parentNode.removeChild(sel.children[0]);
    sel.appendChild(fragment.cloneNode(true));
  }

  async restoreValues() {
    const values = await storage.getTtsOptions();
    const { rateInput, pitchInput, voiceInput, volumeInput, mainToggleSwitch } = this;
    if (typeof values.rate === 'number') {
      rateInput.value = `${values.rate}`;
    }
    if (typeof values.pitch === 'number') {
      pitchInput.value = `${values.pitch}`;
    }
    if (typeof values.volume === 'number') {
      volumeInput.value = `${values.volume}`;
    }
    if (values.voiceName) {
      voiceInput.value = values.voiceName;
    }
    const isActive = await storage.isActive();
    mainToggleSwitch.setAttribute('aria-checked', String(isActive));
  }

  listen() {
    const { rateInput, pitchInput, voiceInput, volumeInput, mainToggleSwitch } = this;
    rateInput.addEventListener('input', this.handleInput);
    pitchInput.addEventListener('input', this.handleInput);
    volumeInput.addEventListener('input', this.handleInput);
    voiceInput.addEventListener('change', this.handleSelect);
    const playButton = /** @type HTMLButtonElement */ (document.querySelector('.play-button'));
    playButton.addEventListener('click', this.handleTest);
    mainToggleSwitch.addEventListener('change', this.handleToggleExtension.bind(this))
  }

  /**
   * Handles the `input` event from inputs.
   * @param {Event} e 
   */
  async handleInput(e) {
    const input = /** @type HTMLInputElement */ (e.target);
    const { name, value, type } = input;
    if (type !== 'range') {
      return;
    }
    await storage.saveTtsOption(name, parseFloat(value));
  }

  /**
   * Handles the `change` event from the name select.
   * @param {Event} e 
   */
  async handleSelect(e) {
    const input = /** @type HTMLSelectElement */ (e.target);
    const { value } = input;
    await storage.saveTtsOption('voiceName', value);
  }

  /**
   * Handles the `click` on the test button.
   */
  handleTest() {
    this.testSettings();
  }

  /**
   * Sends a command to the event page to play the sentence from the input field.
   */
  async testSettings() {
    const input = /** @type HTMLInputElement */ (document.getElementById('test'));
    const { value } = input;
    if (!value) {
      return;
    }
    const message = /** @type IContentMessage */ ({
      type: 'play',
      data: value,
    });
    return chrome.runtime.sendMessage(message);
  }

  /**
   * Handles the change event on the toggle button.
   * @param {Event} e 
   */
  handleToggleExtension(e) {
    const button = /** @type HTMLButtonElement */ (e.target);
    const enabled = button.getAttribute('aria-checked') === 'true';
    this.toggleExtension(enabled);
  }

  /**
   * Toggle the extension on or off.
   * @param {boolean} enabled true if the extension should be enabled.
   */
  async toggleExtension(enabled) {
    await storage.saveTtsOption('active', enabled);
  }
}

const popup = new OptionsPage();
popup.initialize();
