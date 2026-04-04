import { app, BrowserWindow, globalShortcut, ipcMain, screen, desktopCapturer } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname$1 = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname$1, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
function createWindow() {
  win = new BrowserWindow({
    width: 700,
    height: 480,
    // Ghost Window specific configuration
    frame: false,
    // No title bar or window borders
    transparent: true,
    // Transparent background
    alwaysOnTop: true,
    // Floating above all other windows
    skipTaskbar: true,
    // Don't show in the OS taskbar/dock
    movable: true,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname$1, "preload.mjs"),
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}
function toggleWindow() {
  if (!win) return;
  if (win.isVisible()) {
    win.hide();
  } else {
    win.showInactive();
  }
}
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
app.whenReady().then(() => {
  createWindow();
  const toggleShortcut = "CommandOrControl+/";
  globalShortcut.register(toggleShortcut, () => {
    toggleWindow();
  });
  const moveWindow = (pos) => {
    if (!win) return;
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenW, height: screenH } = primaryDisplay.workAreaSize;
    const { width: winW, height: winH } = win.getBounds();
    const margin = 20;
    let x = (screenW - winW) / 2;
    let y = (screenH - winH) / 2;
    switch (pos) {
      case "tl":
        x = margin;
        y = margin;
        break;
      case "tc":
        x = (screenW - winW) / 2;
        y = margin;
        break;
      case "tr":
        x = screenW - winW - margin;
        y = margin;
        break;
      case "lc":
        x = margin;
        y = (screenH - winH) / 2;
        break;
      case "cc":
        x = (screenW - winW) / 2;
        y = (screenH - winH) / 2;
        break;
      case "rc":
        x = screenW - winW - margin;
        y = (screenH - winH) / 2;
        break;
      case "bl":
        x = margin;
        y = screenH - winH - margin;
        break;
      case "bc":
        x = (screenW - winW) / 2;
        y = screenH - winH - margin;
        break;
      case "br":
        x = screenW - winW - margin;
        y = screenH - winH - margin;
        break;
    }
    win.setPosition(Math.round(x), Math.round(y), true);
  };
  globalShortcut.register("CommandOrControl+Up", () => moveWindow("tc"));
  globalShortcut.register("CommandOrControl+Down", () => moveWindow("bc"));
  globalShortcut.register("CommandOrControl+Left", () => moveWindow("lc"));
  globalShortcut.register("CommandOrControl+Right", () => moveWindow("rc"));
  globalShortcut.register("CommandOrControl+Alt+Up", () => moveWindow("tl"));
  globalShortcut.register("CommandOrControl+Alt+Right", () => moveWindow("tr"));
  globalShortcut.register("CommandOrControl+Alt+Down", () => moveWindow("br"));
  globalShortcut.register("CommandOrControl+Alt+Left", () => moveWindow("bl"));
  globalShortcut.register("CommandOrControl+Alt+C", () => moveWindow("cc"));
  globalShortcut.register("CommandOrControl+Shift+A", () => {
    win == null ? void 0 : win.show();
    win == null ? void 0 : win.webContents.send("trigger-problem-assistant");
  });
  ipcMain.on("hide-window", () => {
    win == null ? void 0 : win.hide();
  });
  ipcMain.on("resize-window", (_event, { width, height }) => {
    if (!win) return;
    const bounds = win.getBounds();
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;
    const newX = Math.round(centerX - width / 2);
    const newY = Math.round(centerY - height / 2);
    win.setBounds({
      x: newX,
      y: newY,
      width: Math.round(width),
      height: Math.round(height)
    }, true);
  });
  ipcMain.on("set-ignore-mouse", (_event, ignore) => {
    win == null ? void 0 : win.setIgnoreMouseEvents(ignore, { forward: true });
  });
  ipcMain.handle("capture-screen", async () => {
    console.log("Capture screen requested...");
    try {
      if (win) {
        win.hide();
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      const primaryDisplay = screen.getPrimaryDisplay();
      const { width, height } = primaryDisplay.size;
      const sources = await desktopCapturer.getSources({
        types: ["screen"],
        thumbnailSize: { width, height }
      });
      if (win) {
        win.showInactive();
      }
      const selectedSource = sources[0];
      if (!selectedSource) throw new Error("No screen source found for capture");
      const dataUrl = selectedSource.thumbnail.toDataURL();
      return dataUrl;
    } catch (error) {
      if (win) win.showInactive();
      console.error("Failed to capture screen (Main Process):", error);
      throw error;
    }
  });
});
app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
