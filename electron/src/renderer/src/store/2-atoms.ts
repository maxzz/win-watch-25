import { atom } from "jotai";
import { atomFamily } from "jotai-family";
import { notice } from "@renderer/components/ui/local-ui/7-toaster/7-toaster";
import { type ControlNode, type NativeBounds, type WindowInfo } from "./9-tmapi-types";
import { appSettings } from "./1-ui-settings";

function isBoundsEmpty(bounds: NativeBounds): boolean {
    return bounds.right <= bounds.left || bounds.bottom <= bounds.top;
}

async function getCurrentHighlightBounds(
    selectedHandle: string | null,
    control: ControlNode
): Promise<NativeBounds | null> {
    const initialBounds = control.bounds;
    if (!initialBounds) {
        notice.info("Selected control has no bounds to highlight.");
        return null;
    }
    if (isBoundsEmpty(initialBounds)) {
        if (appSettings.showEmptyBoundsNotification) {
            notice.info("Selected control bounds are empty.");
        }
        return null;
    }
    if (!selectedHandle || !control.runtimeId) {
        return initialBounds;
    }

    const rectJson = await tmApi.getControlCurrentBounds(selectedHandle, control.runtimeId);
    const currentBounds = JSON.parse(rectJson) as NativeBounds | null;

    if (!currentBounds) {
        notice.info("Selected control has no current on-screen bounds.");
        return null;
    }
    if (isBoundsEmpty(currentBounds)) {
        if (appSettings.showEmptyBoundsNotification) {
            notice.info("Selected control current bounds are empty.");
        }
        return null;
    }

    return currentBounds;
}

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
export const windowControlsTreeHwndAtom = atom<string | null>(null);
export const windowControlsTreeLoadingAtom = atom<boolean>(false);
export const windowControlsTreeRefreshingAtom = atom<boolean>(false);
export const windowControlsTreeErrorAtom = atom<string | null>(null);
const CONTROLS_TREE_CACHE_TTL_MS = 60_000;
const CONTROLS_TREE_CACHE_MAX_ENTRIES = 20;
type ControlsTreeCacheMeta = {
    updatedAt: number;
    lastAccessAt: number;
};
const controlsTreeCacheMetaMap = new Map<string, ControlsTreeCacheMeta>();
const cachedWindowControlsTreeFamily = atomFamily(
    (_hwnd: string) => atom<ControlNode | null>(null)
);

function removeControlsTreeCacheEntry(set: (a: any, ...args: any[]) => void, hwnd: string): void {
    controlsTreeCacheMetaMap.delete(hwnd);
    set(cachedWindowControlsTreeFamily(hwnd), null);
    cachedWindowControlsTreeFamily.remove(hwnd);
}

function pruneExpiredControlsTreeCache(set: (a: any, ...args: any[]) => void, now: number): void {
    for (const [hwnd, meta] of controlsTreeCacheMetaMap.entries()) {
        if (now - meta.updatedAt > CONTROLS_TREE_CACHE_TTL_MS) {
            removeControlsTreeCacheEntry(set, hwnd);
        }
    }
}

function pruneOverflowControlsTreeCache(set: (a: any, ...args: any[]) => void): void {
    if (controlsTreeCacheMetaMap.size <= CONTROLS_TREE_CACHE_MAX_ENTRIES) {
        return;
    }
    const entriesByLastAccessAsc = [...controlsTreeCacheMetaMap.entries()]
        .sort((a, b) => a[1].lastAccessAt - b[1].lastAccessAt);
    const entriesToRemoveCount = controlsTreeCacheMetaMap.size - CONTROLS_TREE_CACHE_MAX_ENTRIES;
    for (let i = 0; i < entriesToRemoveCount; i++) {
        const entry = entriesByLastAccessAsc[i];
        if (!entry) break;
        removeControlsTreeCacheEntry(set, entry[0]);
    }
}

export const refreshWindowControlsTreeAtom = atom(
    null,
    async (get, set, options?: { force?: boolean; }): Promise<void> => {
        const selectedHwnd = get(selectedHwndAtom);
        if (!selectedHwnd) {
            set(windowControlsTreeLoadingAtom, false);
            set(windowControlsTreeRefreshingAtom, false);
            set(windowControlsTreeErrorAtom, null);
            set(windowControlsTreeAtom, null);
            set(windowControlsTreeHwndAtom, null);
            return;
        }

        const now = Date.now();
        pruneExpiredControlsTreeCache(set, now);

        const forceRefresh = options?.force === true;
        const cachedTree = get(cachedWindowControlsTreeFamily(selectedHwnd));
        if (!forceRefresh && cachedTree) {
            controlsTreeCacheMetaMap.set(selectedHwnd, {
                updatedAt: controlsTreeCacheMetaMap.get(selectedHwnd)?.updatedAt ?? now,
                lastAccessAt: now,
            });
            set(windowControlsTreeLoadingAtom, false);
            set(windowControlsTreeRefreshingAtom, false);
            set(windowControlsTreeErrorAtom, null);
            set(windowControlsTreeAtom, cachedTree);
            set(windowControlsTreeHwndAtom, selectedHwnd);
            return;
        }

        const isShowingCurrentWindowTree =
            get(windowControlsTreeAtom) !== null && get(windowControlsTreeHwndAtom) === selectedHwnd;

        set(windowControlsTreeLoadingAtom, !isShowingCurrentWindowTree);
        set(windowControlsTreeRefreshingAtom, isShowingCurrentWindowTree);
        set(windowControlsTreeErrorAtom, null);

        try {
            const json = await tmApi.getControlTree(selectedHwnd);
            const tree: ControlNode = JSON.parse(json) as ControlNode;
            // Guard against races: if the selection changed while we were fetching,
            // don't overwrite the tree for the new selection.
            if (get(selectedHwndAtom) !== selectedHwnd) {
                return;
            }
            set(cachedWindowControlsTreeFamily(selectedHwnd), tree);
            const updatedNow = Date.now();
            controlsTreeCacheMetaMap.set(selectedHwnd, { updatedAt: updatedNow, lastAccessAt: updatedNow });
            pruneOverflowControlsTreeCache(set);
            set(windowControlsTreeAtom, tree);
            set(windowControlsTreeHwndAtom, selectedHwnd);
        } catch (e) {
            console.error("Failed to fetch control tree", e);
            notice.error(`Failed to fetch control tree of window (handle: ${selectedHwnd})`);
            if (get(selectedHwndAtom) === selectedHwnd) {
                set(windowControlsTreeErrorAtom, "Failed to fetch control tree");
            }
        } finally {
            if (get(selectedHwndAtom) === selectedHwnd) {
                set(windowControlsTreeLoadingAtom, false);
                set(windowControlsTreeRefreshingAtom, false);
            }
        }
    }
);

export const selectedControlAtom = atom<ControlNode | null>(null);

export const setShowEmptyBoundsNotificationAtom = atom(
    null,
    (_get, _set, enabled: boolean): void => {
        appSettings.showEmptyBoundsNotification = enabled;
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

        try {
            const selectedHandle = get(selectedHwndAtom);
            const b = await getCurrentHighlightBounds(selectedHandle, control);
            if (!b) return;
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
