"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("api", {
  hideWindow: () => electron.ipcRenderer.send("hide-window"),
  resizeWindow: (width, height) => electron.ipcRenderer.send("resize-window", { width, height }),
  setIgnoreMouse: (ignore) => electron.ipcRenderer.send("set-ignore-mouse", ignore),
  captureScreen: () => electron.ipcRenderer.invoke("capture-screen"),
  studentSearch: (query, institutionName, googleDriveAccessToken) => electron.ipcRenderer.invoke("handle-student-search", query, institutionName, googleDriveAccessToken),
  connectGoogleDrive: () => electron.ipcRenderer.invoke("connect-google-drive"),
  searchGoogleDrive: (query, token) => electron.ipcRenderer.invoke("search-google-drive", query, token),
  createDriveDocument: (name, token) => electron.ipcRenderer.invoke("create-drive-document", name, token),
  deleteDriveFile: (fileId, token) => electron.ipcRenderer.invoke("delete-drive-file", fileId, token),
  sendDetectedEvents: (events) => electron.ipcRenderer.invoke("send-detected-events", events),
  onDetectedEvents: (callback) => {
    electron.ipcRenderer.on("detected-events", (_event, events) => callback(events));
    return () => electron.ipcRenderer.removeAllListeners("detected-events");
  },
  onScannerStatus: (callback) => {
    electron.ipcRenderer.on("scanner-status", (_event, status) => callback(status));
    return () => electron.ipcRenderer.removeAllListeners("scanner-status");
  },
  onTriggerProblemAssistant: (callback) => {
    electron.ipcRenderer.on("trigger-problem-assistant", () => callback());
  },
  setScreenwatchMode: (mode) => electron.ipcRenderer.send("set-screenwatch-mode", mode),
  triggerManualScan: () => electron.ipcRenderer.invoke("trigger-manual-scan"),
  // Add more methods as needed
  onMainProcessMessage: (callback) => {
    electron.ipcRenderer.on("main-process-message", (_event, message) => callback(message));
  }
});
