import { atom } from 'jotai';
import { ControlNode, WindowInfo } from '../types';

export const activeHandleAtom = atom<string | null>(null);

export const controlTreeAtom = atom(async (get) => {
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
});

export const activeWindowInfoAtom = atom<WindowInfo | null>(null);
