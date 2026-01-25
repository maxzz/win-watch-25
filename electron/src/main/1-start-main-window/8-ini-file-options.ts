import path from "path";
import fs from "fs";
import { app, type BrowserWindow, type Rectangle } from "electron";
import { fixBounds } from "../3-utils-main";

export type IniOptions = {
    bounds: Rectangle;  // x, y, width, height
    devTools: boolean;  // is devTools open
    showMenu?: boolean; // is menu bar visible
};

function loadIniFileOptions(): IniOptions | undefined {
    try {
        const cnt = fs.readFileSync(INI_FNAME, 'utf8');
        const data = JSON.parse(cnt) as IniOptions;
        const bounds = fixBounds(data?.bounds); // it seems like windows is doing this as well
        bounds && (data.bounds = bounds);
        return data;
    }
    catch (e) {
    }
}

function saveIniFileOptions(win: BrowserWindow) {
    const data: IniOptions = {
        bounds: win.getNormalBounds(),
        devTools: win.webContents.isDevToolsOpened(),
        showMenu: win.isMenuBarVisible(),
    };
    fs.writeFileSync(INI_FNAME, JSON.stringify(data));
}

const INI_FNAME = path.join(app.getPath('userData'), "init.json"); // c:\users\maxzz\appdata\roaming\electron-window-monitor\ini-options.json

export const iniFileOptions = {
    get options() {
        return _options;
    },
    set options(value: IniOptions | undefined) {
        _options = value;
    },
    load() {
        _options = loadIniFileOptions();
    },
    save(appWindow: BrowserWindow | null) {
        appWindow && saveIniFileOptions(appWindow);
    }
};

let _options: IniOptions | undefined = undefined;
