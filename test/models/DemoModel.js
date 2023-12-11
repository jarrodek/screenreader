export class DemoModel {
  /**
   * @param {import('@playwright/test').Page} page 
   */
  constructor(page) {
    this.page = page;
    /** @type import('@playwright/test').Locator */
    this.shortParagraph = page.locator('#short');
    /** @type import('@playwright/test').Locator */
    this.noTextElement = page.locator('#noText');
  }

  async openDemo() {
    await this.page.goto('./index.html');
  }

  async openPopup({ page, extensionId }) {
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
  }

  /**
   * Reads the list of CSS class names added to the element identified by the `handle`
   * @param {import('@playwright/test').Locator} handle 
   * @returns {Promise<string[]>}
   */
  async readStyles(handle) {
    return handle.evaluate(node => Array.from(node.classList));
  }

  /**
   * Tests the Chrome browser for the default outline color, as defined in the content script CSS.
   * @returns {Promise<string>} The reference outline.
   */
  getReferenceOutline() {
    return this.page.evaluate(() => {
      const p = document.createElement('p');
      // the same as in css/content.css -> .sr-highlight
      p.style.outline = '5px auto -webkit-focus-ring-color';
      document.body.appendChild(p);
      const style = getComputedStyle(p).outline;
      document.body.removeChild(p);
      return style;
    });
  }
}
