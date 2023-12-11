import { ScreenReaderService } from "./ScreenReaderService.js";
import storage from "./lib/storage.js";

/** @typedef {import('./types').IWorkerMessage} IWorkerMessage */

async function unloadTabs() {
  const message = /** @type IWorkerMessage */ ({ type: "unload" });
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    chrome.tabs.sendMessage(tab.id, message);
  }
}

async function activateTabs() {
  const message = /** @type IWorkerMessage */ ({ type: "load" });
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    chrome.tabs.sendMessage(tab.id, message);
  }
}

/**
 * Updates the badge depending on the active state.
 * @param {boolean} active Whether the extension is active.
 */
async function setBadge(active) {
  const path = active
      ? chrome.runtime.getURL("img/16x16-on.png")
      : chrome.runtime.getURL("img/16x16-off.png");
  chrome.action.setIcon({ path });
}

async function stopSpeaking() {
  const speaking = await chrome.tts.isSpeaking();
  if (speaking) {
    await chrome.tts.stop();
  }
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'sync') {
    return;
  }
  if (typeof changes.active === 'undefined') {
    return;
  }

  if (!changes.active.newValue) {
    unloadTabs();
    stopSpeaking();
  } else {
    activateTabs();
  }
  setBadge(changes.active.newValue);
});

chrome.runtime.onStartup.addListener(async () => {
  const active = await storage.isActive();
  setBadge(active);
});

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  const handler = new ScreenReaderService(sendResponse);
  handler.handleMessage(message);
  return true;
});
