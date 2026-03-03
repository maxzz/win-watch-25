import { BrowserWindow } from "electron";

const ZOOM_STEP = 0.5;

function emitZoomChanged(win: BrowserWindow, level: number) {
    win.webContents.send("zoom-changed", level);
}

export function setZoomLevel(win: BrowserWindow, level: number): number {
    win.webContents.setZoomLevel(level);
    emitZoomChanged(win, level);
    return level;
}

export function applyZoomAction(win: BrowserWindow, action: "in" | "out" | "reset"): number {
    const current = win.webContents.getZoomLevel();
    let next = current;

    if (action === "in") next += ZOOM_STEP;
    else if (action === "out") next -= ZOOM_STEP;
    else next = 0;

    if (next === current) {
        emitZoomChanged(win, current);
        return current;
    }

    return setZoomLevel(win, next);
}

// Additional zoom shortcuts beyond Electron defaults.
export function registerZoomShortcuts(win: BrowserWindow) {
    win.webContents.on("before-input-event", (event, input) => {
        if (input.type !== "keyDown") return;

        const ctrlOrCmd = input.control || input.meta;
        if (!ctrlOrCmd) return;

        const key = input.key;
        const normalized = key.length === 1 ? key.toLowerCase() : key;

        if (normalized === "=" || normalized === "+" || normalized === "Add") {
            applyZoomAction(win, "in");
            event.preventDefault();
            return;
        }

        if (normalized === "-" || normalized === "_" || normalized === "Subtract") {
            applyZoomAction(win, "out");
            event.preventDefault();
            return;
        }

        if (normalized === "0" || normalized === "num0" || normalized === "Numpad0") {
            applyZoomAction(win, "reset");
            event.preventDefault();
            return;
        }

        if (normalized === ",") {
            win.webContents.send("open-options-dialog");
            event.preventDefault();
        }
    });
}
