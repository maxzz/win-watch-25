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
    // const { windowInfos } = useWindowList();
    useActiveWindow(null); // Side effects only
    // const [activeHandle, setActiveHandle] = useAtom(activeHandleAtom);
    const refreshWindowInfosOnStart = useSetAtom(doRefreshWindowInfosOnAppStartAtom);

    useEffect(
        () => {
            refreshWindowInfosOnStart();

            // Start monitoring on mount
            tmApi.startMonitoring("0"); // Argument ignored by current C++ impl
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
