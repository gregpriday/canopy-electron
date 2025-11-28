import { app, BrowserWindow, Menu, dialog, MenuItemConstructorOptions } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import os from 'os'
import { registerIpcHandlers, sendToRenderer } from './ipc/handlers.js'
import { PtyManager } from './services/PtyManager.js'
import { DevServerManager } from './services/DevServerManager.js'
import { worktreeService } from './services/WorktreeService.js'
import { createWindowWithState } from './windowState.js'
import { store, RecentDirectory } from './store.js'
import { updateRecentDirectories, truncatePathForMenu } from './utils/recentDirectories.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Global error handlers to prevent silent crashes
process.on('uncaughtException', (error) => {
  console.error('[FATAL] Uncaught Exception:', error)
  // Don't exit immediately - let Electron handle cleanup
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL] Unhandled Promise Rejection at:', promise, 'reason:', reason)
})

let mainWindow: BrowserWindow | null = null
let ptyManager: PtyManager | null = null
let devServerManager: DevServerManager | null = null
let cleanupIpcHandlers: (() => void) | null = null

// Terminal ID for the default terminal (for backwards compatibility with renderer)
const DEFAULT_TERMINAL_ID = 'default'

// Menu rebuild unsubscribe function
let unsubscribeMenuRebuild: (() => void) | null = null

/**
 * Open a directory and update recent directories list
 */
async function openDirectory(dirPath: string): Promise<void> {
  try {
    // Validate directory exists
    const fs = await import('fs')
    const stats = await fs.promises.stat(dirPath)
    if (!stats.isDirectory()) {
      throw new Error('Path is not a directory')
    }

    // Update recent directories
    const currentRecents = store.get('appState.recentDirectories', [])
    const updatedRecents = await updateRecentDirectories(currentRecents, dirPath)
    store.set('appState.recentDirectories', updatedRecents)

    // Update lastDirectory
    store.set('appState.lastDirectory', dirPath)

    // Refresh worktree service
    await worktreeService.refresh()
  } catch (error) {
    console.error('[MAIN] Failed to open directory:', error)
    // Show error dialog to user
    if (mainWindow) {
      dialog.showErrorBox('Failed to Open Directory', `Could not open directory:\n${dirPath}\n\nError: ${error}`)
    }
  }
}

/**
 * Build the recent directories submenu
 */
async function buildRecentDirectoriesMenu(): Promise<MenuItemConstructorOptions[]> {
  const recents = store.get('appState.recentDirectories', [])

  // Validate and clean up stale entries
  const { validateRecentDirectories } = await import('./utils/recentDirectories.js')
  const validRecents = await validateRecentDirectories(recents)

  // Update store if any entries were removed
  if (validRecents.length !== recents.length) {
    store.set('appState.recentDirectories', validRecents)
  }

  // Show top 5 most recent
  const recentItems = validRecents.slice(0, 5).map((recent: RecentDirectory) => ({
    label: truncatePathForMenu(recent.path),
    click: async () => {
      await openDirectory(recent.path)
    },
  }))

  if (recentItems.length === 0) {
    return [{ label: 'No Recent Directories', enabled: false }]
  }

  return recentItems
}

/**
 * Build and set the application menu
 */
async function buildMenu(): Promise<void> {
  const template: MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open Directory...',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            if (!mainWindow) return

            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ['openDirectory'],
              title: 'Open Directory',
            })

            if (!result.canceled && result.filePaths[0]) {
              await openDirectory(result.filePaths[0])
            }
          },
        },
        {
          label: 'Open Recent',
          submenu: await buildRecentDirectoriesMenu(),
        },
        { type: 'separator' },
        {
          label: 'Close Window',
          accelerator: 'CmdOrCtrl+W',
          role: 'close',
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
      ],
    },
  ]

  // Add macOS-specific menu items
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    })

    // Update Window menu for macOS
    const windowMenu = template.find(menu => menu.label === 'Window')
    if (windowMenu && Array.isArray(windowMenu.submenu)) {
      windowMenu.submenu.push(
        { type: 'separator' },
        { role: 'front' }
      )
    }
  }

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

async function createWindow(): Promise<void> {
  console.log('[MAIN] Creating window...')
  mainWindow = createWindowWithState({
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#1a1a1a',
  })

  console.log('[MAIN] Window created, loading content...')

  // In dev, load Vite dev server. In prod, load built file.
  if (process.env.NODE_ENV === 'development') {
    console.log('[MAIN] Loading Vite dev server at http://localhost:5173')
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    console.log('[MAIN] Loading production build')
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // --- PTY MANAGER SETUP ---
  // Create PtyManager instance to manage all terminal processes
  console.log('[MAIN] Initializing PtyManager...')
  try {
    ptyManager = new PtyManager()
    console.log('[MAIN] PtyManager initialized successfully')
  } catch (error) {
    console.error('[MAIN] Failed to initialize PtyManager:', error)
    throw error
  }

  // --- DEV SERVER MANAGER SETUP ---
  // Create and initialize DevServerManager
  console.log('[MAIN] Initializing DevServerManager...')
  devServerManager = new DevServerManager()
  devServerManager.initialize(mainWindow, (channel: string, ...args: unknown[]) => {
    if (mainWindow) {
      sendToRenderer(mainWindow, channel, ...args)
    }
  })
  console.log('[MAIN] DevServerManager initialized successfully')

  // Register IPC handlers with PtyManager, DevServerManager, and WorktreeService
  console.log('[MAIN] Registering IPC handlers...')
  cleanupIpcHandlers = registerIpcHandlers(mainWindow, ptyManager, devServerManager, worktreeService)
  console.log('[MAIN] IPC handlers registered successfully')

  // Build application menu
  console.log('[MAIN] Building application menu...')
  await buildMenu()

  // Listen for recent directories changes to rebuild menu
  unsubscribeMenuRebuild = store.onDidChange('appState.recentDirectories', () => {
    console.log('[MAIN] Recent directories changed, rebuilding menu...')
    buildMenu().catch(error => {
      console.error('[MAIN] Failed to rebuild menu:', error)
    })
  })

  // Spawn the default terminal for backwards compatibility with the renderer
  console.log('[MAIN] Spawning default terminal...')
  try {
    ptyManager.spawn(DEFAULT_TERMINAL_ID, {
      cwd: process.env.HOME || os.homedir(),
      cols: 80,
      rows: 30,
    })
    console.log('[MAIN] Default terminal spawned successfully')
  } catch (error) {
    console.error('[MAIN] Failed to spawn default terminal:', error)
    // Don't throw - let the app continue without the default terminal
  }

  mainWindow.on('closed', async () => {
    // Save terminal state before cleanup (to avoid race with before-quit)
    if (ptyManager) {
      const terminals = ptyManager.getAll().map(t => ({
        id: t.id,
        type: t.type || 'shell',
        title: t.title || 'Terminal',
        cwd: t.cwd,
        worktreeId: t.worktreeId,
      }))
      store.set('appState.terminals', terminals)
    }

    // Cleanup menu rebuild listener
    if (unsubscribeMenuRebuild) {
      unsubscribeMenuRebuild()
      unsubscribeMenuRebuild = null
    }

    // Cleanup IPC handlers first to prevent any late IPC traffic
    if (cleanupIpcHandlers) {
      cleanupIpcHandlers()
      cleanupIpcHandlers = null
    }
    // Stop all worktree monitors
    await worktreeService.stopAll()
    // Stop all dev servers
    if (devServerManager) {
      await devServerManager.stopAll()
      devServerManager = null
    }
    // Then cleanup PTY manager (kills all terminals)
    if (ptyManager) {
      ptyManager.dispose()
      ptyManager = null
    }
    mainWindow = null
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

// Cleanup on quit - prevent default to ensure graceful shutdown completes
app.on('before-quit', (event) => {
  // Prevent quit until cleanup is done
  event.preventDefault()

  // Save terminal state before cleanup
  if (ptyManager) {
    const terminals = ptyManager.getAll().map(t => ({
      id: t.id,
      type: t.type || 'shell',
      title: t.title || 'Terminal',
      cwd: t.cwd,
      worktreeId: t.worktreeId,
    }))
    store.set('appState.terminals', terminals)
  }

  // Cleanup menu rebuild listener
  if (unsubscribeMenuRebuild) {
    unsubscribeMenuRebuild()
    unsubscribeMenuRebuild = null
  }

  // Perform cleanup
  Promise.all([
    worktreeService.stopAll(),
    devServerManager ? devServerManager.stopAll() : Promise.resolve(),
    new Promise<void>((resolve) => {
      if (ptyManager) {
        ptyManager.dispose()
        ptyManager = null
      }
      resolve()
    })
  ]).then(() => {
    // Cleanup IPC handlers
    if (cleanupIpcHandlers) {
      cleanupIpcHandlers()
      cleanupIpcHandlers = null
    }
    // Now actually quit
    app.exit(0)
  }).catch((error) => {
    console.error('Error during cleanup:', error)
    app.exit(1)
  })
})
