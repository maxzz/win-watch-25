import { atom } from "jotai";
import { notice } from "@renderer/components/ui/local-ui/7-toaster/7-toaster";
import { type ControlNode, type WindowInfo } from "./9-tmapi-types";

//#region Window list

export const windowInfosAtom = atom<WindowInfo[]>([]);
export const windowInfosLoadingAtom = atom<boolean>(false);

export const doRefreshWindowInfosAtom = atom(
    null,
    async (get, set): Promise<void> => {
        set(windowInfosLoadingAtom, true);
        try {
            const json = await tmApi.getTopLevelWindows();
            const data = JSON.parse(json) as WindowInfo[];
            set(windowInfosAtom, data);
        } catch (e) {
            notice.error("Failed to fetch windows");
            console.error("Failed to fetch windows", e);
        } finally {
            set(windowInfosLoadingAtom, false);
        }
    }
);

// Call this on app startup. It guarantees we only fetch the initial window list once,
// even if the React tree mounts twice in dev (StrictMode).
let didRefreshWindowInfosOnAppStart = false;
export const doOnAppStartRefreshWindowInfosAtom = atom(
    null,
    (_get, set): void => {
        if (!didRefreshWindowInfosOnAppStart) {
            didRefreshWindowInfosOnAppStart = true;
            set(doRefreshWindowInfosAtom);
        }
    }
);

//export const activeWindowInfoAtom = atom<WindowInfo | null>(null);
export const activeHwndAtom = atom<string | null>(null);

//#endregion Window list

//#region Control tree

export const doGetWindowControlsTreeAtom = atom(
    async (get): Promise<ControlNode | null> => {
        const activeHandle = get(activeHwndAtom);
        if (!activeHandle) {
            return null;
        }

        try {
            const json = await tmApi.getControlTree(activeHandle);
            const tree: ControlNode = JSON.parse(json) as ControlNode;
            return tree;
        } catch (e) {
            console.error("Failed to fetch control tree", e);
            notice.error(`Failed to fetch control tree of window (handle: ${activeHandle})`);
            return null;
        }
    }
);

export const selectedControlAtom = atom<ControlNode | null>(null);

export const autoHighlightSelectedControlAtom = atom<boolean>(false);

export const setAutoHighlightSelectedControlAtom = atom(
    null,
    async (_get, set, enabled: boolean): Promise<void> => {
        set(autoHighlightSelectedControlAtom, enabled);

        if (!enabled) {
            try {
                await tmApi.hideHighlight();
            } catch (e) {
                console.warn("Failed to hide highlight", e);
            }
        }
    }
);

export const setSelectedControlAtom = atom(
    null,
    async (get, set, control: ControlNode | null): Promise<void> => {
        set(selectedControlAtom, control);

        // Highlight the selected control if auto-highlight is enabled
        if (!control || !get(autoHighlightSelectedControlAtom)) {
            return;
        }

        const b = control.bounds;
        if (!b) {
            return; // no bounds, no highlight
        }

        try {
            await tmApi.highlightRect(
                { left: b.left, top: b.top, right: b.right, bottom: b.bottom },
                { blinkCount: 1, color: 0x00D4FF, borderWidth: 2 }
            );
        } catch (e) {
            console.warn("Failed to highlight selected control", e);
        }
    }
);

export const doInvokeControlAtom = atom(
    null,
    async (get, _set, control: ControlNode): Promise<void> => {
        const activeHandle = get(activeHwndAtom);
        if (!activeHandle || !control.runtimeId) {
            return;
        }

        try {
            console.log("💻Invoking", control.name);

            await tmApi.invokeControl(activeHandle, control.runtimeId);
        } catch (e) {
            console.error("Failed to invoke control", e);
            notice.error(`Failed to invoke control (handle: ${activeHandle}, runtimeId: ${control.runtimeId})`);
        }
    }
);

//#endregion Control tree

//#region comments

// Start monitoring this specific window if needed, or just fetch tree
// The "StartMonitoring" in API is global for "active window changes".
// If we want to show controls for the *currently selected* window in the tree, we just fetch controls.
// If we want to *track* the user's focus, we use startMonitoring.
// The requirement: "monitor active window ... and show controls inside THIS window".
// And "List of all top level windows... show windows as items tree...".
// "Clicking a window switches active monitoring to that window"?
// Or does it just show that window?
// Plan: "Clicking a window switches active monitoring to that window".
// So if user clicks a window in the tree, we act as if it's active?
// Or we just Inspect it.

// async function load() {
//     try {
//         const json = await tmApi.getControlTree(activeHandle!);
//         if (!mounted) {
//             return;
//         }
//         const tree = JSON.parse(json);
//         setControlTree(tree);
//     } catch (e) {
//         console.error("Failed to fetch control tree", e);
//     }
// }

//#endregion comments

//#region Highlight selected window

export const doHighlightSelectedWindowAtom = atom(
    null,
    async (get, set): Promise<void> => {
        const activeHandle = get(activeHwndAtom);
        if (!activeHandle) return;

        try {
            const rectJson = await tmApi.getWindowRect(activeHandle);
            const rect = JSON.parse(rectJson);
            if (!rect) {
                notice.error(`Failed to get window rectangle of selected window (handle: ${activeHandle})`);
                return;
            }

            const { left, top, right, bottom } = rect;
            await tmApi.highlightRect({ left, top, right, bottom }, { blinkCount: 3, color: 0xFF8400, borderWidth: 2 });

            notice.success(`Highlighted selected window (handle: ${activeHandle})`);
        } catch (e) {
            console.error(`Failed to highlight selected window (handle: ${activeHandle})`, e);
            notice.error(`Failed to highlight selected window (handle: ${activeHandle})`);
        }
    }
);

//#endregion Highlight selected window
