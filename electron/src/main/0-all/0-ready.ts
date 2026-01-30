import { app, BrowserWindow } from "electron";
import { electronApp, optimizer } from "@electron-toolkit/utils";
import { appWindow } from "../1-start-main-window/9-app-window-instance";
import { createTopWindow } from "../1-start-main-window/1-create-top-window";
import { setListenersRenderCalls } from "../1-start-main-window/2-1-listeners-render-calls";
import { setAppWindowListeners } from "../1-start-main-window/2-2-listeners-of-app-window";
import { iniFileOptions } from "../1-start-main-window/8-ini-file-options";

app.whenReady().then(async () => {
    console.log('main-process-ready'); // This is marker for vscode to start debugger in launch.json. Don't remove this line!

    electronApp.setAppUserModelId('com.electron');

    app.on('browser-window-created', (_, window) => {
        optimizer.watchWindowShortcuts(window);
    });

    await installReactDevtools();
    setListenersRenderCalls();

    iniFileOptions.load();
    createAppWindow();

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createTopWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

function createAppWindow() {
    appWindow.wnd = createTopWindow();
    setAppWindowListeners(appWindow);
}

async function installReactDevtools() {
    // Installs React Developer Tools into the default session (dev only).
    // With `--user-data-dir=...` set in your Electron launch args, the installed extension
    // is persisted under that profile directory.
    if (app.isPackaged) return;

    try {
        const { default: installExtension, REACT_DEVELOPER_TOOLS } = await import("electron-devtools-installer");
        await installExtension(REACT_DEVELOPER_TOOLS);
    } catch (error) {
        console.warn("Failed to install React DevTools:", error);
    }
}
