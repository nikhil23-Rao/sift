import { ipcMain, BrowserWindow } from 'electron'
import { captureScreen } from './capture'
import { handleStudentSearch } from './search'

export function setupIpc(win: BrowserWindow | null) {
  ipcMain.on('hide-window', () => {
    win?.hide()
  })

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
    }, true)
  })

  ipcMain.on('set-ignore-mouse', (_event, ignore) => {
    win?.setIgnoreMouseEvents(ignore, { forward: true })
  })

  ipcMain.handle('capture-screen', async () => {
    return await captureScreen(win)
  })

  ipcMain.handle('handle-student-search', async (_event, query, institutionName) => {
    return await handleStudentSearch(query, institutionName)
  })
}
