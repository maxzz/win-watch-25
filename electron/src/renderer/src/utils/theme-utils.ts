import { appSettings } from "@renderer/store/1-ui-settings";

export function isThemeDark(theme: string) {
    if (theme === 'light') return false;
    if (theme === 'dark') return true;
    return getIsSystemDark();
}

export function toggleTheme(theme: string) {
    if (theme === 'dark') {
        appSettings.theme = 'light';
    } 
    else if (theme === 'light') {
        appSettings.theme = 'dark';
    } 
    else {
        const isSystemDark = getIsSystemDark();
        appSettings.theme = isSystemDark ? 'light' : 'dark';
    }
}

export function getIsSystemDark() {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

