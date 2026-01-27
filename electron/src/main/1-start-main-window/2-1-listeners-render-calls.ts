import { BrowserWindow, ipcMain } from "electron";
import { winwatchPlugin } from "../0-all/1-load-plugin";

export function setListenersRenderCalls() {
    // IPC handlers
    ipcMain.handle('get-top-level-windows', () => {
        if (!winwatchPlugin) {
            return JSON.stringify([{ title: "Native module not loaded" }]);
        }
        return winwatchPlugin.getTopLevelWindows();
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
    // bounds: {x, y, width, height}
    // options: {color?, borderWidth?, blinkCount?}
    ipcMain.handle('highlight-rect', (_, bounds: { x: number; y: number; width: number; height: number }, options?: { color?: number; borderWidth?: number; blinkCount?: number }) => {
        if (!winwatchPlugin) return;
        winwatchPlugin.highlightRect(bounds, options);
    });

    // Hide the highlight rectangle
    ipcMain.handle('hide-highlight', () => {
        if (!winwatchPlugin) return;
        winwatchPlugin.hideHighlight();
    });
}
