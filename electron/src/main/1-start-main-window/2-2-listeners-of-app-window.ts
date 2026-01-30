import { shell } from "electron";
import { iniFileOptions } from "./8-ini-file-options";
import { type AppWindow } from "./9-app-window-instance";
//import { registerZoomShortcuts } from "./5-app-menu";

export function setAppWindowListeners(appWindow: AppWindow) {
    if (!appWindow.wnd) {
        return;
    }
    
    // If DevTools are opened only after the first navigation is complete, React DevTools
    // often won’t hook until the next reload. We auto-reload once (devtools enabled) so the
    // React tabs appear without requiring the user to press Ctrl+R.
    let didAutoReloadForDevtools = false;
    
    appWindow.wnd.once('ready-to-show', () => {
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
        if (iniFileOptions.options?.devTools && !appWindow.wnd?.webContents.isDevToolsOpened()) {
            appWindow.wnd?.webContents.openDevTools();

            if (!didAutoReloadForDevtools) {
                didAutoReloadForDevtools = true;
                setTimeout(() => appWindow.wnd?.webContents.reload(), 0);
            }
        }
        appWindow.wnd?.webContents.send('main-process-message', (new Date).toLocaleString()); // Test active push message to Renderer-process.
    });

    // Register additional zoom shortcuts (numpad +/-, Ctrl+Shift+=)
    //registerZoomShortcuts(appWindow.wnd);
}
