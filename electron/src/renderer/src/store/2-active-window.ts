import { atom } from 'jotai';
import { ControlNode, WindowInfo } from '../types';

export const activeHandleAtom = atom<string | null>(null);
export const controlTreeAtom = atom<ControlNode | null>(null);
export const activeWindowInfoAtom = atom<WindowInfo | null>(null);
