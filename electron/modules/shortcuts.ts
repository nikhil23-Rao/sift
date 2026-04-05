import { globalShortcut, BrowserWindow, screen } from 'electron'

export function registerShortcuts(win: BrowserWindow | null) {
  const toggleShortcut = 'CommandOrControl+/'
  globalShortcut.register(toggleShortcut, () => {
    if (!win) return
    if (win.isVisible()) {
      win.hide()
    } else {
      win.showInactive()
    }
  })

  const moveWindow = (pos: 'tl' | 'tc' | 'tr' | 'lc' | 'cc' | 'rc' | 'bl' | 'bc' | 'br') => {
    if (!win) return
    const primaryDisplay = screen.getPrimaryDisplay()
    const { width: screenW, height: screenH } = primaryDisplay.workAreaSize
    const { width: winW, height: winH } = win.getBounds()
    const margin = 20

    let x = (screenW - winW) / 2
    let y = (screenH - winH) / 2

    switch (pos) {
      case 'tl': x = margin; y = margin; break
      case 'tc': x = (screenW - winW) / 2; y = margin; break
      case 'tr': x = screenW - winW - margin; y = margin; break
      case 'lc': x = margin; y = (screenH - winH) / 2; break
      case 'cc': x = (screenW - winW) / 2; y = (screenH - winH) / 2; break
      case 'rc': x = screenW - winW - margin; y = (screenH - winH) / 2; break
      case 'bl': x = margin; y = screenH - winH - margin; break
      case 'bc': x = (screenW - winW) / 2; y = screenH - winH - margin; break
      case 'br': x = screenW - winW - margin; y = screenH - winH - margin; break
    }

    win.setPosition(Math.round(x), Math.round(y), true)
  }

  globalShortcut.register('CommandOrControl+Up', () => moveWindow('tc'))
  globalShortcut.register('CommandOrControl+Down', () => moveWindow('bc'))
  globalShortcut.register('CommandOrControl+Left', () => moveWindow('lc'))
  globalShortcut.register('CommandOrControl+Right', () => moveWindow('rc'))
  globalShortcut.register('CommandOrControl+Alt+Up', () => moveWindow('tl'))
  globalShortcut.register('CommandOrControl+Alt+Right', () => moveWindow('tr'))
  globalShortcut.register('CommandOrControl+Alt+Down', () => moveWindow('br'))
  globalShortcut.register('CommandOrControl+Alt+Left', () => moveWindow('bl'))
  globalShortcut.register('CommandOrControl+Alt+C', () => moveWindow('cc'))

  globalShortcut.register('CommandOrControl+Shift+A', () => {
    win?.show()
    win?.webContents.send('trigger-problem-assistant')
  })
}

export function unregisterShortcuts() {
  globalShortcut.unregisterAll()
}
