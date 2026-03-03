import { app, BrowserWindow, ipcMain } from "electron";
import { winwatchPlugin } from "../0-all/1-load-plugin";
import { appWindow } from "./9-app-window-instance";
import { applyZoomAction } from "./5-app-menu";

type GetTopLevelWindowsOptions = {
    excludeOwnAppWindows?: boolean;
};

export function setListenersRenderCalls() {
    // IPC handlers
    ipcMain.handle('quit-app', () => {
        app.quit();
    });

    ipcMain.handle('get-top-level-windows', (_, options?: GetTopLevelWindowsOptions) => {
        if (!winwatchPlugin) {
            return JSON.stringify([{ title: "Native module not loaded" }]);
        }
        const excludeProcessId = options?.excludeOwnAppWindows ? process.pid : 0;
        return winwatchPlugin.getTopLevelWindows(excludeProcessId);
    });

    ipcMain.handle('get-control-tree', (_, handle) => {
        if (!winwatchPlugin) {
            return JSON.stringify({});
        }
        return winwatchPlugin.getControlTree(handle);
    });

    ipcMain.handle('start-monitoring', (event, handle) => {
        if (!winwatchPlugin) return false;

        // Define callback for active window changes
        const callback = (windowInfoJson: string) => {
            // Send to all windows
            BrowserWindow.getAllWindows().forEach(
                (win) => {
                    win.webContents.send('active-window-changed', windowInfoJson);
                }
            );
        };

        return winwatchPlugin.startMonitoring(callback);
    });

    ipcMain.handle('stop-monitoring', () => {
        if (!winwatchPlugin) return false;
        return winwatchPlugin.stopMonitoring();
    });

    ipcMain.handle('invoke-control', (_, handle, runtimeId) => {
        if (!winwatchPlugin) return false;
        return winwatchPlugin.invokeControl(handle, runtimeId);
    });

    // Highlight a rectangle on screen
    // bounds: {left, top, right, bottom}
    // options: {color?, borderWidth?, blinkCount?}
    ipcMain.handle('highlight-rect', (_, bounds: { left: number; top: number; right: number; bottom: number }, options?: { color?: number; borderWidth?: number; blinkCount?: number }) => {
        if (!winwatchPlugin) return;
        winwatchPlugin.highlightRect(bounds, options);
    });

    // Hide the highlight rectangle
    ipcMain.handle('hide-highlight', () => {
        if (!winwatchPlugin) return;
        winwatchPlugin.hideHighlight();
    });

    // Get current window rectangle in screen coordinates
    ipcMain.handle('get-window-rect', (_, handle: string) => {
        if (!winwatchPlugin) return 'null';
        return winwatchPlugin.getWindowRect(handle);
    });

    // Get current control bounds in screen coordinates by runtime ID
    ipcMain.handle('get-control-current-bounds', (_, handle: string, runtimeId: string) => {
        if (!winwatchPlugin) return 'null';
        return winwatchPlugin.getControlCurrentBounds(handle, runtimeId);
    });

    // Check whether a window handle is currently valid
    ipcMain.handle('is-window-handle-valid', (_, handle: string) => {
        if (!winwatchPlugin) return false;
        return winwatchPlugin.isWindowHandleValid(handle);
    });

    ipcMain.handle("zoom-action", (_, action: "in" | "out" | "reset") => {
        const win = appWindow.wnd ?? BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0];
        if (!win) return 0;
        return applyZoomAction(win, action);
    });

    ipcMain.handle("get-zoom-level", () => {
        const win = appWindow.wnd ?? BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0];
        return win?.webContents.getZoomLevel() ?? 0;
    });
}
