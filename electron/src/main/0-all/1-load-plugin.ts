import { fileURLToPath } from "url";
import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import path from "node:path";
import { app } from "electron";

const pathToPlugin = getPluginPath();
const pathToPreload = makePath('../preload/index.mjs');
const pathToRenderer = makePath('../renderer/index.html');
const pathToIcon = makePath('../assets/public/favicon.svg');

function makePath(path: string): string {
    return fileURLToPath(new URL(path, import.meta.url)).replace(/\\/g, '/');
}

function getPluginPath(): string {
    // Packaged app: extraResources copies plugins into process.resourcesPath
    if (app.isPackaged) {
        return path.join(process.resourcesPath, "plugins", "winwatch.node").replace(/\\/g, "/");
    }

    // Dev / unpackaged: plugins are staged at repo-root/dist-electron/plugins
    const devPath = makePath('../../../../dist-electron/plugins/winwatch.node');
    if (existsSync(devPath)) return devPath;

    // Fallback (older relative layout)
    return makePath('../../../dist-electron/plugins/winwatch.node');
}

function loadNapiWinWatchPlugin(): any {
    const require = createRequire(import.meta.url);
    try {
        const winwatch = require(pathToPlugin);
        return winwatch;
    } catch (error) {
        console.error('Failed to load winwatch.node from default path:\n', error);
        return null;
    }
}

const winwatchPlugin = loadNapiWinWatchPlugin();

export { winwatchPlugin, pathToPreload, pathToRenderer, pathToIcon };
