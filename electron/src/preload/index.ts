import { contextBridge, ipcRenderer } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';
//import { type WinWatchApi } from '../vite-typescript/preload-types';

// Types for highlight API
interface HighlightBounds {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface HighlightOptions {
    color?: number;       // RGB color (e.g., 0xFF0000 for red)
    borderWidth?: number; // Border width in pixels (default: 5)
    blinkCount?: number;  // Number of blinks (0 = stay visible, default: 5)
}

// Custom APIs for renderer
const api: WinWatchApi = {
    getTopLevelWindows: () => ipcRenderer.invoke('get-top-level-windows'),
    getControlTree: (handle: string) => ipcRenderer.invoke('get-control-tree', handle),
    startMonitoring: (handle: string) => ipcRenderer.invoke('start-monitoring', handle),
    stopMonitoring: () => ipcRenderer.invoke('stop-monitoring'),
    invokeControl: (handle: string, runtimeId: string) => ipcRenderer.invoke('invoke-control', handle, runtimeId),
    onActiveWindowChanged: (callback: (data: string) => void) => {
        const subscription = (_event: any, value: string) => callback(value);
        ipcRenderer.on('active-window-changed', subscription);
        return () => ipcRenderer.removeListener('active-window-changed', subscription);
    },
    // Highlight a rectangle on screen
    highlightRect: (bounds: HighlightBounds, options?: HighlightOptions) => ipcRenderer.invoke('highlight-rect', bounds, options),
    // Hide the highlight rectangle
    hideHighlight: () => ipcRenderer.invoke('hide-highlight'),
};

// if (process.contextIsolated) {
    try {
        contextBridge.exposeInMainWorld('electron', electronAPI);
        contextBridge.exposeInMainWorld('tmApi', api);
    } catch (error) {
        console.error(error);
    }
// } else {
//     // @ts-ignore (define in dts)
//     window.electron = electronAPI;
//     // @ts-ignore (define in dts)
//     window.api = api;
// }
