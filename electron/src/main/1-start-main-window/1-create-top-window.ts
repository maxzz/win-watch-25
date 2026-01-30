import { shell, BrowserWindow } from "electron";
import { is } from "@electron-toolkit/utils";
import { pathToPreload, pathToRenderer, pathToIcon } from "../0-all/1-load-plugin";
import { iniFileOptions } from "./8-ini-file-options";

export function createTopWindow(): BrowserWindow {
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        show: false,
        ...(iniFileOptions.options?.bounds),
        autoHideMenuBar: true,
        icon: pathToIcon, // TODO: this is not right. Later.
        webPreferences: {
            preload: pathToPreload,
            sandbox: false,
            contextIsolation: true
        }
    });

    // If DevTools are opened *after* the page has already loaded, React DevTools often needs a
    // manual reload (Ctrl+R) to hook into React at document start. Opening DevTools before
    // navigation avoids that.
    if (is.dev && iniFileOptions.options?.devTools && !mainWindow.webContents.isDevToolsOpened()) {
        mainWindow.webContents.openDevTools();
    }

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
    } else {
        mainWindow.loadFile(pathToRenderer);
    }

    return mainWindow;
}
