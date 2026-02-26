import { atom } from "jotai";
import { notice } from "@renderer/components/ui/local-ui/7-toaster/7-toaster";
import { selectedHwndAtom } from "./2-1-atoms-windows-list";
import { appSettings } from "./1-ui-settings";
import { type ControlNode } from "./9-tmapi-types";
import { getCurrentHighlightBounds } from "./2-4-atoms-bounds";
import { selectedControlAtom } from "./2-2-atoms-controls-list";

export function getSafeHighlightBlinkCount(): number {
    const raw = Number(appSettings.highlightBlinkCount);
    if (!Number.isFinite(raw)) return 3;
    return Math.max(1, Math.min(10, Math.round(raw)));
}

export const setHighlightBlinkCountAtom = atom(
    null,
    (_get, _set, blinkCount: number): void => {
        appSettings.highlightBlinkCount = Math.max(1, Math.min(10, Math.round(blinkCount)));
    }
);

export const setAutoHighlightSelectedControlAtom = atom(
    null,
    async (get, _set, enabled: boolean): Promise<void> => {
        appSettings.autoHighlightSelectedControl = enabled;

        if (!enabled) {
            try {
                await tmApi.hideHighlight();
            } catch (e) {
                console.warn("Failed to hide highlight", e);
            }
            return;
        }

        const selected = get(selectedControlAtom);
        if (!selected) return;

        try {
            const selectedHandle = get(selectedHwndAtom);
            const b = await getCurrentHighlightBounds(selectedHandle, selected);
            if (!b) return;
            await tmApi.highlightRect({ ...b }, { blinkCount: getSafeHighlightBlinkCount(), color: 0xFF0000, borderWidth: 2 });
        } catch (e) {
            console.warn("Failed to highlight selected control", e);
        }
    }
);

export const setSelectedControlAtom = atom(
    null,
    async (get, set, control: ControlNode | null): Promise<void> => {
        set(selectedControlAtom, control);

        // Highlight the selected control if auto-highlight is enabled
        if (!control || !appSettings.autoHighlightSelectedControl) {
            return;
        }

        try {
            const selectedHandle = get(selectedHwndAtom);
            const b = await getCurrentHighlightBounds(selectedHandle, control);
            if (!b) return;
            await tmApi.highlightRect({ ...b }, { blinkCount: getSafeHighlightBlinkCount(), color: 0xFF0000, borderWidth: 2 });
        } catch (e) {
            console.warn("Failed to highlight selected control", e);
        }
    }
);

//#region Highlight selected window

export const doHighlightSelectedWindowAtom = atom(
    null,
    async (get, _set): Promise<void> => {
        const selectedHandle = get(selectedHwndAtom);
        if (!selectedHandle) return;

        try {
            const rectJson = await tmApi.getWindowRect(selectedHandle);
            const rect = JSON.parse(rectJson);
            if (!rect) {
                notice.error(`Failed to get window rectangle of selected window (handle: ${selectedHandle})`);
                return;
            }

            const { left, top, right, bottom } = rect;
            const blinkCount = getSafeHighlightBlinkCount();
            await tmApi.highlightRect({ left, top, right, bottom }, { blinkCount, color: 0xFF8400, borderWidth: 2 });

            notice.success(`Highlighted selected window (handle: ${selectedHandle})`);
        } catch (e) {
            console.error(`Failed to highlight selected window (handle: ${selectedHandle})`, e);
            notice.error(`Failed to highlight selected window (handle: ${selectedHandle})`);
        }
    }
);

//#endregion Highlight selected window
