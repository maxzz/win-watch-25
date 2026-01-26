import { fileURLToPath } from 'url';
import { createRequire } from 'node:module';
import { is } from '@electron-toolkit/utils';

const pathToPlugin = makePath(`../../../plugins/${is.dev ? 'Debug' : 'Release'}/winwatch.node`);
const pathToPreload = makePath('../preload/index.mjs');
const pathToRenderer = makePath('../renderer/index.html');
const pathToIcon = makePath('../assets/public/favicon.svg');

function makePath(path: string): string {
    return fileURLToPath(new URL(path, import.meta.url)).replace(/\\/g, '/');
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
