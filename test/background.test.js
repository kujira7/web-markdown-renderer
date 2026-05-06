const assert = require("node:assert/strict");

const sentMessages = [];
let contextMenuClickListener;

global.chrome = {
  action: {
    onClicked: {
      addListener() {}
    }
  },
  contextMenus: {
    create() {},
    onClicked: {
      addListener(listener) {
        contextMenuClickListener = listener;
      }
    }
  },
  runtime: {
    lastError: null,
    onInstalled: {
      addListener() {}
    }
  },
  scripting: {
    executeScript(_details, callback) {
      callback();
    },
    insertCSS(_details, callback) {
      callback();
    }
  },
  tabs: {
    sendMessage(_tabId, message, callback) {
      sentMessages.push(message);
      if (message.type === "MARKDOWN_RENDERER_PING") {
        global.chrome.runtime.lastError = { message: "Receiving end does not exist." };
        callback();
        global.chrome.runtime.lastError = null;
        return;
      }
      callback({ ok: true });
    }
  }
};

require("../background");

assert.equal(typeof contextMenuClickListener, "function");

contextMenuClickListener(
  {
    menuItemId: "render-selection-as-markdown",
    selectionText: "# Google Docs selection"
  },
  { id: 123 }
);

setImmediate(() => {
  assert.deepEqual(sentMessages.at(-1), {
    type: "MARKDOWN_RENDERER_OPEN",
    text: "# Google Docs selection"
  });

  console.log("background tests passed");
});
