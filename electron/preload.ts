import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('api', {
  hideWindow: () => ipcRenderer.send('hide-window'),
  resizeWindow: (width: number, height: number) => ipcRenderer.send('resize-window', { width, height }),
  // Add more methods as needed
  onMainProcessMessage: (callback: (message: string) => void) => {
    ipcRenderer.on('main-process-message', (_event, message) => callback(message))
  }
})
