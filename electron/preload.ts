import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('api', {
  hideWindow: () => ipcRenderer.send('hide-window'),
  resizeWindow: (width: number, height: number) => ipcRenderer.send('resize-window', { width, height }),
  setIgnoreMouse: (ignore: boolean) => ipcRenderer.send('set-ignore-mouse', ignore),
  captureScreen: () => ipcRenderer.invoke('capture-screen'),
  studentSearch: (query: string, institutionName?: string, googleDriveAccessToken?: string) => ipcRenderer.invoke('handle-student-search', query, institutionName, googleDriveAccessToken),
  connectGoogleDrive: () => ipcRenderer.invoke('connect-google-drive'),
  searchGoogleDrive: (query: string, token: string) => ipcRenderer.invoke('search-google-drive', query, token),
  createDriveDocument: (name: string, token: string) => ipcRenderer.invoke('create-drive-document', name, token),
  deleteDriveFile: (fileId: string, token: string) => ipcRenderer.invoke('delete-drive-file', fileId, token),
  onTriggerProblemAssistant: (callback: () => void) => {
    ipcRenderer.on('trigger-problem-assistant', () => callback())
  },
  // Add more methods as needed
  onMainProcessMessage: (callback: (message: string) => void) => {
    ipcRenderer.on('main-process-message', (_event, message) => callback(message))
  }
})
