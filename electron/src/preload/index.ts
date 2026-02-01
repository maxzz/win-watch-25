import { contextBridge, ipcRenderer } from "electron";
import { electronAPI } from "@electron-toolkit/preload";

// Custom APIs for renderer in the main process

const mainLocalApi: WinWatchApi = {
    // Get list of all top-level windows
    getTopLevelWindows: () => ipcRenderer.invoke('get-top-level-windows'),
    // Get control tree for a specific window
    getControlTree: (handle: string) => ipcRenderer.invoke('get-control-tree', handle),
    // Start monitoring active window changes
    startMonitoring: (handle: string) => ipcRenderer.invoke('start-monitoring', handle),
    // Stop monitoring active window changes
    stopMonitoring: () => ipcRenderer.invoke('stop-monitoring'),
    // Invoke a control (e.g. click)
    invokeControl: (handle: string, runtimeId: string) => ipcRenderer.invoke('invoke-control', handle, runtimeId),
    
    // Listen for active window changes from backend
    onActiveWindowChanged: (callback: (data: string) => void) => {
        const subscription = (_event: any, value: string) => callback(value);
        ipcRenderer.on('active-window-changed', subscription);
        return () => ipcRenderer.removeListener('active-window-changed', subscription);
    },

    // Highlight a rectangle on screen
    highlightRect: (bounds: Rect4, options?: HighlightOptions) => ipcRenderer.invoke('highlight-rect', bounds, options),
    
    // Hide the highlight rectangle
    hideHighlight: () => ipcRenderer.invoke('hide-highlight'),

    // Get current window rectangle in screen coordinates
    getWindowRect: (handle: string) => ipcRenderer.invoke('get-window-rect', handle),
};

try {
    contextBridge.exposeInMainWorld('electron', electronAPI);
    contextBridge.exposeInMainWorld('tmApi', mainLocalApi);
} catch (error) {
    //TODO: it should be handled better: show a message to the user and terminate the app. TODO: show a message to the user and terminate the app.
    console.error(error); 
}
