import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { fileURLToPath } from 'url'
import { createRequire } from 'node:module'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'

const require = createRequire(import.meta.url)

// Load NAPI plugin
let winwatch: any
try {
  // In dev mode, try Debug build first, then Release
  if (is.dev) {
    try {
      const debugPath = fileURLToPath(new URL('../../../napi-plugin/build/Debug/winwatch.node', import.meta.url))
      console.log('Trying to load Debug build from:', debugPath)
      winwatch = require(debugPath)
      console.log('Loaded winwatch.node from Debug build')
    } catch (debugError) {
      console.log('Debug build not found, trying Release build')
      const releasePath = fileURLToPath(new URL('../../../napi-plugin/build/Release/winwatch.node', import.meta.url))
      console.log('Trying to load Release build from:', releasePath)
      winwatch = require(releasePath)
      console.log('Loaded winwatch.node from Release build')
    }
  } else {
    // Production: use Release build
    const releasePath = fileURLToPath(new URL('../../../napi-plugin/build/Release/winwatch.node', import.meta.url))
    winwatch = require(releasePath)
  }
} catch (error) {
  console.error('Failed to load winwatch.node from default path:', error)
  try {
      // Try adjacent to executable or other paths
      const fallbackPath = fileURLToPath(new URL('./winwatch.node', import.meta.url))
      winwatch = require(fallbackPath)
  } catch (e) {
      console.error('Failed to load winwatch.node fallback:', e)
  }
}

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon: fileURLToPath(new URL('../../build/icon.png', import.meta.url)) } : {}),
    webPreferences: {
      preload: fileURLToPath(new URL('../preload/index.mjs', import.meta.url)),
      sandbox: false,
      contextIsolation: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(fileURLToPath(new URL('../renderer/index.html', import.meta.url)))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC handlers
  ipcMain.handle('get-top-level-windows', () => {
    if (!winwatch) return JSON.stringify([{ title: "Native module not loaded" }])
    return winwatch.getTopLevelWindows()
  })

  ipcMain.handle('get-control-tree', (_, handle) => {
    if (!winwatch) return JSON.stringify({})
    return winwatch.getControlTree(handle)
  })

  ipcMain.handle('start-monitoring', (event, handle) => {
    if (!winwatch) return false
    
    // Define callback for active window changes
    const callback = (windowInfoJson: string) => {
      // Send to all windows
      BrowserWindow.getAllWindows().forEach(win => {
        win.webContents.send('active-window-changed', windowInfoJson)
      })
    }
    
    return winwatch.startMonitoring(callback)
  })
  
  ipcMain.handle('stop-monitoring', () => {
    if (!winwatch) return false
    return winwatch.stopMonitoring()
  })

  ipcMain.handle('invoke-control', (_, handle, runtimeId) => {
    if (!winwatch) return false
    return winwatch.invokeControl(handle, runtimeId)
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
