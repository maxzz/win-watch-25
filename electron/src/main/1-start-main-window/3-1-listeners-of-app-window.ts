import { shell } from "electron";
import { iniFileOptions } from "./8-ini-file-options";
import { type AppWindow } from "./9-app-window-instance";
//import { registerZoomShortcuts } from "./5-app-menu";

export function setAppWindowListeners(appWindow: AppWindow) {
    if (!appWindow.wnd) {
        return;
    }
    
    appWindow.wnd.once('ready-to-show', () => {
        if (iniFileOptions.options?.devTools && !appWindow.wnd?.webContents.isDevToolsOpened()) {
            appWindow.wnd?.webContents.toggleDevTools();
        }
        appWindow.wnd?.show();
    });

    appWindow.wnd.on('close', () => {
        iniFileOptions.save(appWindow.wnd);
    });

    appWindow.wnd.webContents.setWindowOpenHandler(({ url }) => { // Make all links open with the browser, not with the application
        if (url.startsWith('https:')) {
            shell.openExternal(url);
        }
        return { action: 'deny' };
    });

    appWindow.wnd.webContents.on('did-finish-load', () => {
        appWindow.wnd?.webContents.send('main-process-message', (new Date).toLocaleString()); // Test active push message to Renderer-process.
    });

    // Register additional zoom shortcuts (numpad +/-, Ctrl+Shift+=)
    //registerZoomShortcuts(appWindow.wnd);
}
