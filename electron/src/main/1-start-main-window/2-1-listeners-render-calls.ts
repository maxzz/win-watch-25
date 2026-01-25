import { BrowserWindow, ipcMain } from 'electron';
import { winwatchPlugin } from '../0-all/1-load-plugin';

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
}
