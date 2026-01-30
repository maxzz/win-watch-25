import { shell } from "electron";
import { iniFileOptions } from "./8-ini-file-options";
import { type AppWindow } from "./9-app-window-instance";
import { autoReloadOnceForReactDevtools, loadReactDevtools } from "../0-all/devtools-config";
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
        const wnd = appWindow.wnd;
        if (iniFileOptions.options?.devTools && wnd && !wnd.webContents.isDevToolsOpened()) {
            const wc = wnd.webContents;

            // Open DevTools after the page is loaded (your preference).
            // If React DevTools doesn't hook on the first load, we do one automatic reload,
            // but wait for the DevTools frontend to finish loading instead of using a fixed timeout.
            const maybeReloadOnce = () => {
                if (!autoReloadOnceForReactDevtools || !loadReactDevtools || didAutoReloadForDevtools) {
                    return;
                }
                didAutoReloadForDevtools = true;

                const dt = wc.devToolsWebContents;
                if (dt && !dt.isDestroyed()) {
                    dt.once('did-finish-load', () => {
                        // Next tick after devtools frontend load is the most reliable moment.
                        setTimeout(() => {
                            if (!wc.isDestroyed()) wc.reload();
                        }, 0);
                    });
                } else {
                    // Fallback: devToolsWebContents not available yet; do a short delay.
                    setTimeout(() => {
                        if (!wc.isDestroyed()) wc.reload();
                    }, 200);
                }
            };

            wc.once('devtools-opened', maybeReloadOnce);
            wc.openDevTools();
        }
        appWindow.wnd?.webContents.send('main-process-message', (new Date).toLocaleString()); // Test active push message to Renderer-process.
    });

    // Register additional zoom shortcuts (numpad +/-, Ctrl+Shift+=)
    //registerZoomShortcuts(appWindow.wnd);
}
