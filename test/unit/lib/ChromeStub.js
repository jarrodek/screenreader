import sinon from 'sinon';

export class ChromeStub {
  static stubs = {
    runtime: {
      /** @type sinon.SinonStub<[message: unknown], Promise<unknown>> */
      sendMessage: null,
    },
  };

  static load() {
    this.#initSkeletonApi();
    /** @ts-ignore */
    this.stubs.runtime.sendMessage = sinon.stub(globalThis.chrome.runtime, 'sendMessage');
  }

  static unload() {
    this.stubs.runtime.sendMessage.restore();
  }

  static #initSkeletonApi() {
    if (typeof globalThis.chrome === 'undefined') {
      // @ts-ignore
      globalThis.chrome = {};
    }
    if (typeof globalThis.chrome.runtime === 'undefined') {
      // @ts-ignore
      globalThis.chrome.runtime = {};
    }
    if (typeof globalThis.chrome.runtime.sendMessage !== 'function') {
      globalThis.chrome.runtime.sendMessage = () => {
        throw new Error(`Not implemented.`);
      };
    }
  }
}
