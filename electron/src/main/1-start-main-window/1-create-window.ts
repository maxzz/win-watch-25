import { shell, BrowserWindow } from 'electron';
import { is } from '@electron-toolkit/utils';
import { pathToPreload, pathToRenderer, pathToIcon } from '../0-all/1-load-plugin';
import { iniFileOptions } from './8-ini-file-options';

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

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
    } else {
        mainWindow.loadFile(pathToRenderer);
    }

    return mainWindow;
}
