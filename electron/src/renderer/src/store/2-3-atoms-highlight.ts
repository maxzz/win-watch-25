import { atom } from "jotai";
import { notice } from "@renderer/components/ui/local-ui/7-toaster/7-toaster";
import { selectedHwndAtom } from "./2-1-atoms-windows-list";
import { appSettings } from "./1-ui-settings";

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
            const blinkCount = Math.max(1, Math.min(10, Math.round(Number(appSettings.highlightBlinkCount) || 3)));
            await tmApi.highlightRect({ left, top, right, bottom }, { blinkCount, color: 0xFF8400, borderWidth: 2 });

            notice.success(`Highlighted selected window (handle: ${selectedHandle})`);
        } catch (e) {
            console.error(`Failed to highlight selected window (handle: ${selectedHandle})`, e);
            notice.error(`Failed to highlight selected window (handle: ${selectedHandle})`);
        }
    }
);

//#endregion Highlight selected window
