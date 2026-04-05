import { app, BrowserWindow, screen } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { registerShortcuts, unregisterShortcuts } from './modules/shortcuts'
import { setupIpc } from './modules/ipc'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '..')

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null

function createWindow() {
  try {
    const primaryDisplay = screen.getPrimaryDisplay()
    const { width: screenWidth } = primaryDisplay.workAreaSize
    const width = 850
    const height = 110

    win = new BrowserWindow({
      width,
      height,
      x: Math.round((screenWidth - width) / 2),
      y: 0,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: false,
      movable: true,
      resizable: false,
      webPreferences: {
        preload: path.join(__dirname, 'preload.mjs'),
        nodeIntegration: false,
        contextIsolation: true,
      },
    })

    win.webContents.on('did-finish-load', () => {
      win?.webContents.send('main-process-message', (new Date()).toLocaleString())
    })

    // Log the URL being loaded
    if (VITE_DEV_SERVER_URL) {
      console.log('Loading URL:', VITE_DEV_SERVER_URL)
      win.loadURL(VITE_DEV_SERVER_URL)
    } else {
      const filePath = path.join(RENDERER_DIST, 'index.html')
      console.log('Loading File:', filePath)
      win.loadFile(filePath)
    }

    // Open DevTools in dev mode
    if (VITE_DEV_SERVER_URL) {
      win.webContents.openDevTools({ mode: 'detach' })
    }

    // Initialize modular features
    registerShortcuts(win)
    setupIpc(win)
    
    win.on('closed', () => {
      win = null
    })
  } catch (err) {
    console.error('Failed to create window:', err)
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(createWindow)

app.on('error', (err) => {
  console.error('Electron app error:', err)
})

app.on('will-quit', () => {
  unregisterShortcuts()
})
