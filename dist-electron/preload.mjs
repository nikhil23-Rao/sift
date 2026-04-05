"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("api", {
  hideWindow: () => electron.ipcRenderer.send("hide-window"),
  resizeWindow: (width, height) => electron.ipcRenderer.send("resize-window", { width, height }),
  setIgnoreMouse: (ignore) => electron.ipcRenderer.send("set-ignore-mouse", ignore),
  captureScreen: () => electron.ipcRenderer.invoke("capture-screen"),
  studentSearch: (query, institutionName) => electron.ipcRenderer.invoke("handle-student-search", query, institutionName),
  onTriggerProblemAssistant: (callback) => {
    electron.ipcRenderer.on("trigger-problem-assistant", () => callback());
  },
  // Add more methods as needed
  onMainProcessMessage: (callback) => {
    electron.ipcRenderer.on("main-process-message", (_event, message) => callback(message));
  }
});
