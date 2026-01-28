import { proxy, subscribe } from "valtio";
import { atom } from "jotai";
import { type ThemeMode, themeApplyMode } from "../utils/theme-apply";
import type { Layout } from "react-resizable-panels";

const STORE_KEY = "win-watch-25";
const STORE_VER = "v1.0";
const STORAGE_ID = `${STORE_KEY}__${STORE_VER}`;

export type PropertiesPanelPosition = 'bottom' | 'right';

export type PanelId = "left-panel" | "right-panel" | "controls-panel" | "control-props-panel";
export type PanelLayout = Record<PanelId, number>;

export interface AppSettings {
    showFooter: boolean;
    theme: ThemeMode;
    panelLayout: PanelLayout; // Panel sizes (percentages) 
    // Properties panel position
    propertiesPanelPosition: PropertiesPanelPosition;
}

const DEFAULT_SETTINGS: AppSettings = {
    showFooter: true,
    theme: "light",
    panelLayout: {
        "left-panel": 25,
        "right-panel": 75,
        "controls-panel": 20,
        "control-props-panel": 80,
    },
    propertiesPanelPosition: 'bottom',
};

// Load settings from localStorage

function loadSettings(): AppSettings {
    try {
        const stored = localStorage.getItem(STORAGE_ID);
        if (stored) {
            // merge stored settings with defaults to ensure new fields are present
            const rv =  { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
            return rv;
        }
    } catch (e) {
        console.error("Failed to load settings", e);
    }
    return { ...DEFAULT_SETTINGS };
}

export const appSettings = proxy<AppSettings>(loadSettings());

themeApplyMode(appSettings.theme);

subscribe(appSettings, () => {
    try {
        themeApplyMode(appSettings.theme);
        localStorage.setItem(STORAGE_ID, JSON.stringify(appSettings));
    } catch (e) {
        console.error("Failed to save settings", e);
    }
});

// Jotai atom setter for panel layout
export const setPanelLayoutAtom = atom(
    null,
    (get, set, layout: Layout) => {
        for (const [key, value] of Object.entries(layout)) {
            appSettings.panelLayout[key as PanelId] = value;
        }
    }
);
