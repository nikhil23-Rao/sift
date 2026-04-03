import { app, BrowserWindow, globalShortcut, ipcMain } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '..')

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.js
// │
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
    width: 700,
    height: 480,
    // Ghost Window specific configuration
    frame: false,            // No title bar or window borders
    transparent: true,      // Transparent background
    alwaysOnTop: true,      // Floating above all other windows
    skipTaskbar: true,      // Don't show in the OS taskbar/dock
    movable: true,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date()).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// Global visibility toggle
function toggleWindow() {
  if (!win) return
  if (win.isVisible()) {
    win.hide()
  } else {
    win.show()
    win.focus()
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(() => {
  createWindow()

  // Register global shortcut: CmdOrCtrl + Alt + Space
  const shortcut = 'CommandOrControl+Alt+Space'
  const ret = globalShortcut.register(shortcut, () => {
    console.log(`${shortcut} is pressed`)
    toggleWindow()
  })

  if (!ret) {
    console.log('Registration failed')
  }

  // Handle IPC for hiding window from renderer
  ipcMain.on('hide-window', () => {
    win?.hide()
  })

  // Handle IPC for resizing window from renderer
  ipcMain.on('resize-window', (_event, { width, height }) => {
    if (!win) return
    const bounds = win.getBounds()
    const centerX = bounds.x + bounds.width / 2
    const centerY = bounds.y + bounds.height / 2
    
    const newX = Math.round(centerX - width / 2)
    const newY = Math.round(centerY - height / 2)
    
    win.setBounds({
      x: newX,
      y: newY,
      width: Math.round(width),
      height: Math.round(height)
    }, true) // true enables smooth animation on macOS
  })
})

app.on('will-quit', () => {
  // Unregister all shortcuts
  globalShortcut.unregisterAll()
})
