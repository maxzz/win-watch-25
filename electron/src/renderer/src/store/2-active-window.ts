import { atom } from 'jotai';
import { ControlNode, WindowInfo } from '../types';

export const activeHandleAtom = atom<string | null>(null);

export const selectedControlAtom = atom<ControlNode | null>(null);

export const controlTreeAtom = atom(
    async (get): Promise<ControlNode | null> => {
        const activeHandle = get(activeHandleAtom);
        if (!activeHandle) {
            return null;
        }

        try {
            const json = await tmApi.getControlTree(activeHandle);
            const tree: ControlNode = JSON.parse(json);
            return tree;
        } catch (e) {
            console.error("Failed to fetch control tree", e);
            return null;
        }
    }
);

export const activeWindowInfoAtom = atom<WindowInfo | null>(null);


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
