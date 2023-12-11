import { test as base, chromium, expect } from '@playwright/test';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const extensionPath = join(__dirname, '..');

const test = base.extend({
  // eslint-disable-next-line no-empty-pattern
  context: async ({}, use) => {
    const launchOptions = {
      devtools: true,
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        `--headless=new`
      ],
      viewport: {
        width: 1920,
        height: 1080
      },
    };
    const context = await chromium.launchPersistentContext('', launchOptions);
    await use(context);
    await context.close();
  },

  extensionId: async ({ context }, use) => {
    let [background] = context.serviceWorkers();
    if (!background) {
      background = await context.waitForEvent('serviceworker');
    }
    const extensionId = background.url().split('/')[2];
    await use(extensionId);
  },
});

export { test, expect }
