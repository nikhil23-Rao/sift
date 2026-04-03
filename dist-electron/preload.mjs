"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("api", {
  hideWindow: () => electron.ipcRenderer.send("hide-window"),
  // Add more methods as needed
  onMainProcessMessage: (callback) => {
    electron.ipcRenderer.on("main-process-message", (_event, message) => callback(message));
  }
});
