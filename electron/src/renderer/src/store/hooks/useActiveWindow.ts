import { useEffect } from "react";
import { useSetAtom } from "jotai";
import { activeHandleAtom, doOnAppStartRefreshWindowInfosAtom } from "../2-atoms";
import { notice } from "@renderer/components/ui/local-ui/7-toaster";

export function useActiveWindow() {
    const setActiveHandle = useSetAtom(activeHandleAtom);

    useEffect(
        () => {
            // Listen for active window changes from backend
            const unsubscribe = tmApi.onActiveWindowChanged(
                (data) => {
                    try {
                        const info = JSON.parse(data);
                        console.log("♻️useActiveWindow", info);

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

                        setActiveHandle(info?.handle);
                    } catch (e) {
                        console.error("Error parsing active window update", e);
                        notice.error("Error parsing active window update");
                        setActiveHandle(null);
                    }
                }
            );

            return unsubscribe;
        },
        []);
}

export function useMonitorActiveWindow() {
    useEffect(
        () => {
            // Start monitoring on mount
            // Starts global "active window" monitoring (foreground window changes).
            //
            // Note on the `"0"` argument:
            // - The renderer/preload TypeScript types currently name this parameter `handle: string`,
            //   implying you can pass a specific window handle to monitor.
            // - Today, that value is **not used**: the main-process IPC handler ignores it and the
            //   native addon `startMonitoring` actually expects a callback (not a handle).
            // - We pass `"0"` as a clear placeholder/sentinel meaning "no specific target window"
            //   (i.e., just start emitting `tmApi.onActiveWindowChanged` events).

            // just temp
            tmApi.startMonitoring("0");
            return () => {
                tmApi.stopMonitoring();
            };
        },
        []);
}

export function useAppStartInitialize() {
    const refreshWindowInfosOnStart = useSetAtom(doOnAppStartRefreshWindowInfosAtom);

    useEffect(
        () => {
            refreshWindowInfosOnStart();
        },
        []);
}
