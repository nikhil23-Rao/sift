import { ipcMain, BrowserWindow, screen } from 'electron'
import { captureScreen } from './capture'
import { handleStudentSearch } from './search'

export function setupIpc(win: BrowserWindow | null) {
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
}
