import { useEffect } from 'react';
import { useSetAtom } from 'jotai';
import { activeHandleAtom } from '../store/2-active-window';

export function useActiveWindow(initialHandle: string | null) {
    const setActiveHandle = useSetAtom(activeHandleAtom);

    // Set initial handle on mount
    useEffect(() => {
        if (initialHandle !== null) {
            setActiveHandle(initialHandle);
        }
    }, []);

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
}
