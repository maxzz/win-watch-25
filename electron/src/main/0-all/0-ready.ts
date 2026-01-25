import { app, BrowserWindow } from 'electron';
import { electronApp, optimizer } from '@electron-toolkit/utils';
import { createTopWindow } from '../1-start-main-window/1-create-window';
import { iniFileOptions } from '../1-start-main-window/8-ini-file-options';
import { createAppWindow } from '../1-start-main-window/1-create-app-window';
import { setListenersRenderCalls } from '../1-start-main-window/3-3-listeners-render-calls';

app.whenReady().then(() => {
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
