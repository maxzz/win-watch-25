import { useEffect } from "react";
import { useSetAtom } from "jotai";
import { useActiveWindow } from "@renderer/store/hooks/useActiveWindow";
import { Toaster } from "sonner";
import { UISymbolDefs } from "../ui/icons/symbols";
import { AppHeader } from "./1-app-header";
import { MainContent } from "./2-resizable-panels";
import { SpyAllIcons } from "@renderer/utils/util-hooks/spy-all-icons";
import { doRefreshWindowInfosOnAppStartAtom } from "@renderer/store/2-atoms";

export function App() {
    return (<>
        <UISymbolDefs />
        <Toaster />

        <AppContents />
    </>);
}

export function AppContents() {
    useActiveWindow(null); // Side effects only
    const refreshWindowInfosOnStart = useSetAtom(doRefreshWindowInfosOnAppStartAtom);

    useEffect(
        () => {
            refreshWindowInfosOnStart();

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
            tmApi.startMonitoring("0");
            return () => {
                tmApi.stopMonitoring();
            };
        },
        [refreshWindowInfosOnStart]);

    return (
        <div className="w-screen h-screen text-foreground bg-background flex flex-col overflow-hidden">
            <AppHeader />
            {/* <SpyAllIcons includeSvgSymbols /> */}
            <MainContent className="flex-1" />
        </div>
    );
}
