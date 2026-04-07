import { ipcMain, BrowserWindow, screen } from 'electron'
import { captureScreen } from './capture'
import { handleStudentSearch } from './search'
import { setScreenwatchMode, triggerManualScan } from '../main'

export function setupIpc(win: BrowserWindow | null) {
  ipcMain.on('set-screenwatch-mode', (_event, mode) => {
    console.log(`IPC: Received set-screenwatch-mode -> ${mode}`)
    setScreenwatchMode(mode)
  })

  ipcMain.handle('trigger-manual-scan', async () => {
    console.log('IPC: Received trigger-manual-scan')
    await triggerManualScan()
  })

  ipcMain.on('hide-window', () => {
    win?.hide()
  })

  ipcMain.on('resize-window', (_event, { width, height }) => {
    if (!win) return
    const primaryDisplay = screen.getPrimaryDisplay()
    const { width: screenWidth } = primaryDisplay.workAreaSize
    
    const newX = Math.round((screenWidth - width) / 2)
    const newY = 0 // Glue to the absolute top
    
    win.setBounds({
      x: newX,
      y: newY,
      width: Math.round(width),
      height: Math.round(height)
    }, true)
  })

  ipcMain.on('set-ignore-mouse', (_event, ignore) => {
    win?.setIgnoreMouseEvents(ignore, { forward: true })
  })

  ipcMain.handle('capture-screen', async () => {
    return await captureScreen(win)
  })

  ipcMain.handle('handle-student-search', async (_event, query, institutionName, googleDriveAccessToken) => {
    return await handleStudentSearch(query, institutionName, googleDriveAccessToken)
  })

  ipcMain.handle('send-detected-events', (_event, events) => {
    // Show window without stealing focus
    if (win) {
      win.showInactive()
      win.webContents.send('detected-events', events)
    }
  })

  ipcMain.on('hide-window', () => {
    win?.hide()
  })
}
