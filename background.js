const MENU_ID = "read-selection-as-markdown";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: MENU_ID,
    title: "Read as Markdown",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== MENU_ID || !tab?.id) return;
  openReader(tab.id).catch((error) => logOpenFailure(error));
});

chrome.action.onClicked.addListener((tab) => {
  if (!tab?.id) return;
  openReader(tab.id).catch((error) => logOpenFailure(error));
});

async function openReader(tabId, text) {
  await ensureContentScript(tabId);
  await sendTabMessage(tabId, {
    type: "MARKDOWN_RENDERER_OPEN",
    text
  });
}

async function ensureContentScript(tabId) {
  const ping = await sendTabMessage(tabId, { type: "MARKDOWN_RENDERER_PING" });
  if (ping.ok) {
    return;
  }

  await insertCss(tabId, ["viewer.css"]);
  await executeScript(tabId, ["vendor/marked.umd.js", "vendor/mermaid.min.js", "renderer.js", "content.js"]);
}

function sendTabMessage(tabId, message) {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      const error = chrome.runtime.lastError;
      if (error) {
        resolve({ ok: false, error: error.message });
        return;
      }
      resolve({ ok: true, response });
    });
  });
}

function insertCss(tabId, files) {
  return new Promise((resolve, reject) => {
    chrome.scripting.insertCSS({ target: { tabId }, files }, () => {
      const error = chrome.runtime.lastError;
      if (error) reject(new Error(error.message));
      else resolve();
    });
  });
}

function executeScript(tabId, files) {
  return new Promise((resolve, reject) => {
    chrome.scripting.executeScript({ target: { tabId }, files }, () => {
      const error = chrome.runtime.lastError;
      if (error) reject(new Error(error.message));
      else resolve();
    });
  });
}

function logOpenFailure(error) {
  console.warn("Web Markdown Renderer could not open on this page.", error);
}
