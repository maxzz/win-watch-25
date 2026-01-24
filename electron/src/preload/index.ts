import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  getTopLevelWindows: () => ipcRenderer.invoke('get-top-level-windows'),
  getControlTree: (handle: string) => ipcRenderer.invoke('get-control-tree', handle),
  startMonitoring: (handle: string) => ipcRenderer.invoke('start-monitoring', handle),
  stopMonitoring: () => ipcRenderer.invoke('stop-monitoring'),
  invokeControl: (handle: string, runtimeId: string) => ipcRenderer.invoke('invoke-control', handle, runtimeId),
  onActiveWindowChanged: (callback: (data: string) => void) => {
    const subscription = (_event: any, value: string) => callback(value)
    ipcRenderer.on('active-window-changed', subscription)
    return () => ipcRenderer.removeListener('active-window-changed', subscription)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
