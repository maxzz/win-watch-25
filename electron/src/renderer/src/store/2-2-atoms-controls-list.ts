import { atom } from "jotai";
import { atomFamily } from "jotai-family";
import { notice } from "@renderer/components/ui/local-ui/7-toaster/7-toaster";
import { type ControlNode } from "./9-types-tmapi";
import { initializeControlTreeForHwndAtom, type RawControlNode } from "./2-2-atoms-ini-states";
import { selectedHwndAtom } from "./2-1-atoms-windows-list";

//#region Control tree

export const windowControlsTreeAtom = atom<ControlNode | null>(null);
export const windowControlsTreeHwndAtom = atom<string | null>(null);
export const windowControlsTreeLoadingAtom = atom<boolean>(false);
export const windowControlsTreeRefreshingAtom = atom<boolean>(false);
export const windowControlsTreeErrorAtom = atom<string | null>(null);

const CONTROLS_TREE_CACHE_TTL_MS = 60_000; // TTL stands for "Time To Live". 60 seconds.
const CONTROLS_TREE_CACHE_MAX_ENTRIES = 20;
type ControlsTreeCacheMeta = {
    updatedAt: number;
    lastAccessAt: number;
};
const controlsTreeCacheMetaMap = new Map<string, ControlsTreeCacheMeta>(); // Map of window handle to cache metadata.
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

        const isShowingCurrentWindowTree = get(windowControlsTreeAtom) !== null && get(windowControlsTreeHwndAtom) === selectedHwnd;

        set(windowControlsTreeLoadingAtom, !isShowingCurrentWindowTree);
        set(windowControlsTreeRefreshingAtom, isShowingCurrentWindowTree);
        set(windowControlsTreeErrorAtom, null);

        try {
            const json = await tmApi.getControlTree(selectedHwnd);
            const rawTree = JSON.parse(json) as RawControlNode;
            const cachedTreeAtom = cachedWindowControlsTreeFamily(selectedHwnd);

            const { tree, shouldContinue } = set(initializeControlTreeForHwndAtom, {rawTree, selectedHwnd, cachedTreeAtom});
            if (!shouldContinue) {
                return;
            }
            
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
