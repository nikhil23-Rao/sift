import { app, BrowserWindow, screen, shell, desktopCapturer } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { registerShortcuts, unregisterShortcuts } from './modules/shortcuts'
import { setupIpc } from './modules/ipc'
import { setupDriveHandlers } from './modules/drive'
import { GoogleGenerativeAI } from '@google/generative-ai'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// @ts-ignore
global.__dirname = __dirname;
// @ts-ignore
globalThis.__dirname = __dirname;

process.env.APP_ROOT = path.join(__dirname, '..')

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null
let scannerInterval: NodeJS.Timeout | null = null

// --- Ambient Heartbeat Logic ---

interface ExtractedEvent {
  title: string;
  date: string;
  time?: string;
}

let tesseractWorker: any = null;
let isScannerRunning = false;

async function extractTextFromImage(imageBuffer: Buffer): Promise<string> {
  try {
    if (!tesseractWorker) {
      const { createWorker } = await import('tesseract.js');
      tesseractWorker = await createWorker('eng');
    }
    const { data: { text } } = await tesseractWorker.recognize(imageBuffer);
    return text;
  } catch (error) {
    console.error('Tesseract OCR failed:', error);
    return "";
  }
}

function containsDeadline(text: string): boolean {
  const lowerText = text.toLowerCase();
  
  // High-confidence standalone terms
  const highConfidenceKeywords = ['deadline', 'midterm', 'syllabus', 'assignment due'];
  if (highConfidenceKeywords.some(kw => lowerText.includes(kw))) return true;

  // Regex for dates like 12/31, 12-31, Dec 31st, etc.
  const datePattern = /(\d{1,2}[\/\-]\d{1,2})|((jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2})/i;
  // Regex for times like 11:59pm, 11pm, 23:59, etc.
  const timePattern = /(\d{1,2}(:\d{2})?\s*(pm|am))|(\d{1,2}:\d{2})/i;
  // Keywords that need context (a date or time)
  const contextKeywords = ['due', 'exam', 'quiz', 'test', 'homework', 'submit'];

  const hasDateOrTime = datePattern.test(lowerText) || timePattern.test(lowerText);
  const hasContextKeyword = contextKeywords.some(kw => lowerText.includes(kw));

  // Only trigger if we have a keyword AND a date/time, 
  // which significantly filters out random UI text like system clocks.
  return hasContextKeyword && hasDateOrTime;
}

async function extractEventsWithGemini(text: string): Promise<ExtractedEvent[]> {
  const apiKey = process.env.VITE_GEMINI_API_KEY
  if (!apiKey) {
    console.error('VITE_GEMINI_API_KEY is not set in the environment')
    return []
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

    console.log('Ambient Scanner: Sending OCR text to Gemini:', text.substring(0, 200) + '...')

    const systemPrompt = `
      Analyze the following OCR text from a student's screen. 
      Identify any specific upcoming deadlines, assignments, exams, or meetings.
      
      Output Rules:
      1. Return a JSON array of objects: Array<{ title: string, date: string, time?: string }>
      2. If you find something that looks like a deadline but the OCR is messy, use your best judgment to fix typos (e.g. "mldterm" -> "midterm", "due frlday" -> "due Friday").
      3. If NO specific deadlines are found, return exactly: []
      4. Return ONLY the raw JSON. No markdown backticks, no "json" label.
      
      OCR Text:
      """
      ${text}
      """
    `

    const result = await model.generateContent(systemPrompt)
    const response = await result.response
    const responseText = response.text().trim()
    
    console.log('Ambient Scanner: Gemini raw response text:', responseText)
    
    // Clean potential markdown code blocks
    const jsonMatch = responseText.match(/\[.*\]/s)
    const cleanJson = jsonMatch ? jsonMatch[0] : responseText

    const parsed = JSON.parse(cleanJson)
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    console.error('Ambient Scanner: Gemini extraction failed:', error)
    return []
  }
}

function isHighlySimilar(text1: string, text2: string): boolean {
  if (!text1 || !text2) return false;
  
  const normalize = (t: string) => t.toLowerCase().replace(/[^a-z0-9]/g, '');
  const norm1 = normalize(text1);
  const norm2 = normalize(text2);
  
  if (norm1 === norm2) return true;
  if (norm1.length < 20 || norm2.length < 20) return norm1 === norm2;

  const words1 = text1.toLowerCase().split(/\W+/).filter(w => w.length > 3);
  const words2 = text2.toLowerCase().split(/\W+/).filter(w => w.length > 3);
  
  if (words1.length === 0 || words2.length === 0) return false;
  
  const set2 = new Set(words2);
  const matches = words1.filter(w => set2.has(w)).length;
  const similarity = matches / Math.max(words1.length, words2.length);
  
  return similarity > 0.85; 
}

let lastExtractedText = ""
let screenwatchMode: 'automatic' | 'manual' = 'automatic'

export function setScreenwatchMode(mode: 'automatic' | 'manual') {
  screenwatchMode = mode;
  console.log(`Ambient Scanner: Mode set to ${mode}`);
}

export async function performAmbientScan(browserWindow: BrowserWindow | null) {
  if (!browserWindow || browserWindow.isDestroyed() || isScannerRunning) return

  isScannerRunning = true;
  let imageBuffer: Buffer | null = null;
  let sources: Electron.DesktopCapturerSource[] | null = null;

  try {
    console.log('Ambient Scanner: Scanning...');
    
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.size;
    const scaleFactor = primaryDisplay.scaleFactor || 1;
    
    sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { 
        width: Math.round(width * scaleFactor), 
        height: Math.round(height * scaleFactor) 
      }
    })

    const primarySource = sources[0]
    if (!primarySource) {
      console.log('Ambient Scanner: No primary source found.');
      isScannerRunning = false;
      return;
    }

    // Use PNG for lossless quality, which significantly improves OCR accuracy
    imageBuffer = primarySource.thumbnail.toPNG();
    const text = await extractTextFromImage(imageBuffer);
    
    imageBuffer = null;
    sources = null;

    const sanitizedText = text.trim();
    
    if (sanitizedText.length < 20) {
      console.log('Ambient Scanner: Text too short, skipping.');
      isScannerRunning = false;
      return;
    }

    if (isHighlySimilar(sanitizedText, lastExtractedText)) {
      console.log('Ambient Scanner: Content highly similar to previous scan, skipping.');
      isScannerRunning = false;
      return;
    }

    console.log('Ambient Scanner: New content detected. Checking for keywords...');
    lastExtractedText = sanitizedText;

    if (containsDeadline(text)) {
      console.log('Ambient Scanner: Potential deadline keywords found. Calling Gemini...');
      
      if (browserWindow) {
        browserWindow.showInactive();
        browserWindow.webContents.send('scanner-status', 'analyzing');
      }

      const events = await extractEventsWithGemini(text)
      
      if (events && events.length > 0) {
        console.log(`Ambient Scanner: SUCCESS - Detected ${events.length} events. Sending to HUD.`);
        browserWindow?.webContents.send('detected-events', events.map(e => ({
          ...e,
          id: Math.random().toString(36).substring(7),
          source: 'Ambient Scan'
        })))
      } else {
        console.log('Ambient Scanner: No actionable events extracted by Gemini.');
        browserWindow?.webContents.send('scanner-status', 'idle');
      }
    } else {
      console.log('Ambient Scanner: No deadline keywords found.');
    }
  } catch (err) {
    console.error('Ambient Scanner Error:', err)
    browserWindow?.webContents.send('scanner-status', 'idle');
  } finally {
    isScannerRunning = false;
    imageBuffer = null;
    sources = null;
  }
}

export async function triggerManualScan() {
  console.log('Ambient Scanner: Manual trigger received.')
  const activeWin = BrowserWindow.getAllWindows()[0] || win;
  await performAmbientScan(activeWin)
}

async function startAmbientScanner(browserWindow: BrowserWindow | null) {
  if (scannerInterval) clearInterval(scannerInterval)

  scannerInterval = setInterval(async () => {
    console.log(`Ambient Scanner: Heartbeat (Mode: ${screenwatchMode})`)
    if (screenwatchMode === 'automatic') {
      await performAmbientScan(browserWindow)
    }
  }, 10000)
}

// --- End Ambient Heartbeat Logic ---

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
    setupDriveHandlers()

    // Start the ambient scanner
    startAmbientScanner(win)

    // Handle window open requests by opening in the default system browser
    win.webContents.setWindowOpenHandler(({ url }) => {
      if (url.startsWith('https:') || url.startsWith('http:')) {
        shell.openExternal(url);
      }
      return { action: 'deny' };
    });
    
    win.on('closed', () => {
      win = null
      if (scannerInterval) {
        clearInterval(scannerInterval)
        scannerInterval = null
      }
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
  if (tesseractWorker) {
    tesseractWorker.terminate();
  }
})
