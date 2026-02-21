import { atom } from "jotai";
import { notice } from "@renderer/components/ui/local-ui/7-toaster/7-toaster";
import { type ControlNode, type WindowInfo } from "./9-tmapi-types";
import { appSettings } from "./1-ui-settings";

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
// Window the user is currently inspecting/selected in the UI.
// This must NOT be overwritten by active-window monitoring, otherwise manual selection "doesn't stick".
export const selectedHwndAtom = atom<string | null>(null);

//#endregion Window list

//#region Control tree

export const windowControlsTreeAtom = atom<ControlNode | null>(null);
export const windowControlsTreeLoadingAtom = atom<boolean>(false);
export const windowControlsTreeErrorAtom = atom<string | null>(null);

export const refreshWindowControlsTreeAtom = atom(
    null,
    async (get, set): Promise<void> => {
        const selectedHandle = get(selectedHwndAtom);
        if (!selectedHandle) {
            set(windowControlsTreeLoadingAtom, false);
            set(windowControlsTreeErrorAtom, null);
            set(windowControlsTreeAtom, null);
            return;
        }

        set(windowControlsTreeLoadingAtom, true);
        set(windowControlsTreeErrorAtom, null);
        set(windowControlsTreeAtom, null);

        try {
            const json = await tmApi.getControlTree(selectedHandle);
            const tree: ControlNode = JSON.parse(json) as ControlNode;
            // Guard against races: if the selection changed while we were fetching,
            // don't overwrite the tree for the new selection.
            if (get(selectedHwndAtom) !== selectedHandle) {
                return;
            }
            set(windowControlsTreeAtom, tree);
        } catch (e) {
            console.error("Failed to fetch control tree", e);
            notice.error(`Failed to fetch control tree of window (handle: ${selectedHandle})`);
            if (get(selectedHwndAtom) === selectedHandle) {
                set(windowControlsTreeErrorAtom, "Failed to fetch control tree");
                set(windowControlsTreeAtom, null);
            }
        } finally {
            if (get(selectedHwndAtom) === selectedHandle) {
                set(windowControlsTreeLoadingAtom, false);
            }
        }
    }
);

export const selectedControlAtom = atom<ControlNode | null>(null);

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
        const b = selected?.bounds;
        if (!b) return;

        try {
            await tmApi.highlightRect({ ...b }, { blinkCount: 3, color: 0xFF0000, borderWidth: 2 }); // TODO: need to put these into options dialog
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

        const b = control.bounds;
        if (!b) {
            return; // no bounds, no highlight
        }

        try {
            await tmApi.highlightRect({ ...b }, { blinkCount: 3, color: 0xFF0000, borderWidth: 2 }); // TODO: need to put these into options dialog
        } catch (e) {
            console.warn("Failed to highlight selected control", e);
        }
    }
);

export const doInvokeControlAtom = atom(
    null,
    async (get, _set, control: ControlNode): Promise<void> => {
        const selectedHandle = get(selectedHwndAtom);
        if (!selectedHandle || !control.runtimeId) {
            return;
        }

        try {
            console.log("💻Invoking", control.name);

            await tmApi.invokeControl(selectedHandle, control.runtimeId);
        } catch (e) {
            console.error("Failed to invoke control", e);
            notice.error(`Failed to invoke control (handle: ${selectedHandle}, runtimeId: ${control.runtimeId})`);
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
            await tmApi.highlightRect({ left, top, right, bottom }, { blinkCount: 3, color: 0xFF8400, borderWidth: 2 });

            notice.success(`Highlighted selected window (handle: ${selectedHandle})`);
        } catch (e) {
            console.error(`Failed to highlight selected window (handle: ${selectedHandle})`, e);
            notice.error(`Failed to highlight selected window (handle: ${selectedHandle})`);
        }
    }
);

//#endregion Highlight selected window
