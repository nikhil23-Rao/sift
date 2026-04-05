import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('api', {
  hideWindow: () => ipcRenderer.send('hide-window'),
  resizeWindow: (width: number, height: number) => ipcRenderer.send('resize-window', { width, height }),
  setIgnoreMouse: (ignore: boolean) => ipcRenderer.send('set-ignore-mouse', ignore),
  captureScreen: () => ipcRenderer.invoke('capture-screen'),
  studentSearch: (query: string, institutionName?: string) => ipcRenderer.invoke('handle-student-search', query, institutionName),
  onTriggerProblemAssistant: (callback: () => void) => {
    ipcRenderer.on('trigger-problem-assistant', () => callback())
  },
  // Add more methods as needed
  onMainProcessMessage: (callback: (message: string) => void) => {
    ipcRenderer.on('main-process-message', (_event, message) => callback(message))
  }
})
