import { useState, useEffect } from 'react';
import { ControlNode, WindowInfo } from '../types';

export function useActiveWindow(initialHandle: string | null) {
    const [activeHandle, setActiveHandle] = useState<string | null>(initialHandle);
    const [controlTree, setControlTree] = useState<ControlNode | null>(null);
    const [activeWindowInfo, setActiveWindowInfo] = useState<WindowInfo | null>(null);

    useEffect(
        () => {
            // Listen for active window changes from backend
            const unsubscribe = tmApi.onActiveWindowChanged(
                (data) => {
                    try {
                        const info = JSON.parse(data);
                        if (info && info.handle) {
                            // We might receive partial info, or just handle
                            // Here we should update active handle
                            // But if we are in "manual select" mode, we might want to respect user choice
                            // The requirement says "Active Window Monitoring", so it should update.
                            // Convert handle to same format (hex string usually)
                            // The backend sends decimal string in my C++ code? "std::to_string((long long)hwnd)"
                            // WindowList sends hex pointer string usually. I should align them.
                            // C++ WindowList: (void*)handle -> stream << handle -> hex usually? No, pointer output is hex.
                            // C++ WindowMonitor: std::to_string((long long)hwnd) -> decimal.
                            // I should fix C++ to be consistent. But assuming decimal handle string for now.

                            setActiveHandle(info.handle);
                        }
                    } catch (e) {
                        console.error("Error parsing active window update", e);
                    }
                }
            );

            return unsubscribe;
        },
        []);

    useEffect(
        () => {
            if (!activeHandle) {
                setControlTree(null);
                return;
            }

            let mounted = true;

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

            async function load() {
                try {
                    const json = await tmApi.getControlTree(activeHandle!);
                    if (!mounted) {
                        return;
                    }
                    const tree = JSON.parse(json);
                    setControlTree(tree);
                } catch (e) {
                    console.error("Failed to fetch control tree", e);
                }
            }

            load();

            return () => { mounted = false; };
        },
        [activeHandle]);

    return {
        activeHandle,
        setActiveHandle,
        controlTree,
        activeWindowInfo // We would need to look this up from window list or fetch separately
    };
}
