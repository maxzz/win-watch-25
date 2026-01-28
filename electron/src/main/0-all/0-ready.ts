import { app, BrowserWindow } from "electron";
import { electronApp, optimizer } from "@electron-toolkit/utils";
import { appWindow } from "../1-start-main-window/9-app-window-instance";
import { createTopWindow } from "../1-start-main-window/1-create-top-window";
import { setListenersRenderCalls } from "../1-start-main-window/2-1-listeners-render-calls";
import { setAppWindowListeners } from "../1-start-main-window/2-2-listeners-of-app-window";
import { iniFileOptions } from "../1-start-main-window/8-ini-file-options";

app.whenReady().then(() => {
    console.log('main-process-ready'); // This is marker for vscode to start debugger in launch.json. Don't remove this line!

    electronApp.setAppUserModelId('com.electron');

    app.on('browser-window-created', (_, window) => {
        optimizer.watchWindowShortcuts(window);
    });

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
