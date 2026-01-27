import { proxy, subscribe } from 'valtio';
import { type ThemeMode, themeApplyMode } from '../utils/theme-apply';

const STORE_KEY = "win-watch-25";
const STORE_VER = "v1.0";
const STORAGE_ID = `${STORE_KEY}__${STORE_VER}`;

export type PropertiesPanelPosition = 'bottom' | 'right';

export interface AppSettings {
    showFooter: boolean;
    theme: ThemeMode;
    // Panel sizes (percentages)
    mainPanelSize: number; // Left panel (WindowTree) size
    controlPanelSize: number; // Control tree size (relative to control+properties area)
    // Properties panel position
    propertiesPanelPosition: PropertiesPanelPosition;
}

const DEFAULT_SETTINGS: AppSettings = {
    showFooter: true,
    theme: "light",
    mainPanelSize: 25,
    controlPanelSize: 70,
    propertiesPanelPosition: 'bottom',
};

// Load settings from localStorage

function loadSettings(): AppSettings {
    try {
        const stored = localStorage.getItem(STORAGE_ID);
        if (stored) {
            // merge stored settings with defaults to ensure new fields are present
            return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
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
