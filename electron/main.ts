import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import * as pty from 'node-pty'
import os from 'os'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const shell = os.platform() === 'win32' ? 'powershell.exe' : process.env.SHELL || 'zsh'

let mainWindow: BrowserWindow | null = null
let ptyProcess: pty.IPty | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 15, y: 10 },
    backgroundColor: '#1a1a1a',
  })

  // In dev, load Vite dev server. In prod, load built file.
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // --- PTY SETUP ---
  ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-256color',
    cols: 80,
    rows: 30,
    cwd: process.env.HOME || os.homedir(),
    env: process.env as Record<string, string>,
  })

  // Send data from shell to frontend
  ptyProcess.onData((data: string) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('terminal-incoming', data)
    }
  })

  // Handle PTY exit
  ptyProcess.onExit(({ exitCode, signal }) => {
    console.log(`PTY exited with code ${exitCode}, signal ${signal}`)
  })

  // Receive data from frontend to shell
  ipcMain.on('terminal-keystroke', (_event, data: string) => {
    if (ptyProcess) {
      ptyProcess.write(data)
    }
  })

  // Handle terminal resize
  ipcMain.on('terminal-resize', (_event, { cols, rows }: { cols: number; rows: number }) => {
    if (ptyProcess) {
      ptyProcess.resize(cols, rows)
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
    if (ptyProcess) {
      ptyProcess.kill()
      ptyProcess = null
    }
  })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// Cleanup on quit
app.on('before-quit', () => {
  if (ptyProcess) {
    ptyProcess.kill()
    ptyProcess = null
  }
})
