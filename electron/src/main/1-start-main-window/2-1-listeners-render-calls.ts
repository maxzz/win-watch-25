import { app, BrowserWindow, ipcMain } from "electron";
import { winwatchPlugin } from "../0-all/1-load-plugin";

type GetTopLevelWindowsOptions = {
    excludeOwnAppWindows?: boolean;
};

function parseHandleToBigInt(handle: string): bigint | null {
    const trimmed = handle?.trim();
    if (!trimmed) return null;
    try {
        if (/^0x[0-9a-f]+$/i.test(trimmed)) return BigInt(trimmed);
        if (/^[0-9]+$/.test(trimmed)) return BigInt(trimmed);
        if (/^[0-9a-f]+$/i.test(trimmed)) return BigInt(`0x${trimmed}`);
    } catch {
        // ignore parse errors
    }
    return null;
}

function nativeHandleBufferToBigIntLE(buffer: Buffer): bigint {
    let result = 0n;
    for (let i = buffer.length - 1; i >= 0; i--) {
        result = (result << 8n) + BigInt(buffer[i]);
    }
    return result;
}

function isOwnAppWindowHandle(handle: string): boolean {
    const target = parseHandleToBigInt(handle);
    if (target === null) return false;
    return BrowserWindow.getAllWindows().some((win) => nativeHandleBufferToBigIntLE(win.getNativeWindowHandle()) === target);
}

export function setListenersRenderCalls() {
    // IPC handlers
    ipcMain.handle('quit-app', () => {
        app.quit();
    });

    ipcMain.handle('get-top-level-windows', (_, options?: GetTopLevelWindowsOptions) => {
        if (!winwatchPlugin) {
            return JSON.stringify([{ title: "Native module not loaded" }]);
        }
        const json = winwatchPlugin.getTopLevelWindows();
        if (!options?.excludeOwnAppWindows) {
            return json;
        }
        try {
            const windows = JSON.parse(json) as Array<{ processId?: number; }>;
            const filtered = windows.filter((w) => w.processId !== process.pid);
            return JSON.stringify(filtered);
        } catch (e) {
            console.warn("Failed to filter own app windows", e);
            return json;
        }
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

    ipcMain.handle('is-own-app-window-handle', (_, handle: string) => {
        return isOwnAppWindowHandle(handle);
    });
}
