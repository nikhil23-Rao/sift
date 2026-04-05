import { desktopCapturer, screen, BrowserWindow } from 'electron'

export async function captureScreen(win: BrowserWindow | null) {
  console.log('Capture screen requested...');
  try {
    // Hide the window first to exclude it from the capture
    if (win) {
      win.hide();
      // Give the OS a tiny moment to actually hide the window
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const primaryDisplay = screen.getPrimaryDisplay()
    const { width, height } = primaryDisplay.size
    
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width, height }
    })
    
    // Re-show the window as soon as possible
    if (win) {
      win.showInactive();
    }

    const selectedSource = sources[0];

    if (!selectedSource) throw new Error('No screen source found for capture')
    
    const dataUrl = selectedSource.thumbnail.toDataURL()
    return dataUrl
  } catch (error) {
    if (win) win.showInactive();
    console.error('Failed to capture screen (Main Process):', error)
    throw error
  }
}
