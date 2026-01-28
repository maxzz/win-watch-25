import { useEffect } from "react";
import { useActiveWindow } from "@renderer/store/hooks/useActiveWindow";

import { MainContent } from "./2-resizable-panels";
import { Header } from "./1-header";

export function App() {
    // const { windowInfos } = useWindowList();
    useActiveWindow(null); // Side effects only
    // const [activeHandle, setActiveHandle] = useAtom(activeHandleAtom);

    useEffect(
        () => {
            // Start monitoring on mount
            tmApi.startMonitoring("0"); // Argument ignored by current C++ impl
            return () => {
                tmApi.stopMonitoring();
            };
        },
        []);

    return (
        <div className="w-screen h-screen text-foreground bg-background flex flex-col overflow-hidden">
            <Header />
            <MainContent className="flex-1" />
        </div>
    );
}
