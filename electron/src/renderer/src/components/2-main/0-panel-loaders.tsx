import { Suspense } from "react";
import { useAtom, useAtomValue } from "jotai";
import { useWindowList } from "@renderer/store/hooks/useWindowList";
import { activeHandleAtom, controlTreeAtom } from "@renderer/store/2-active-window";
import type { ControlNode } from "@renderer/types";
import { WindowTree } from "./1-window-tree";
import { ControlTree } from "./2-control-tree";

export function WindowTreePanel() {
    const { windowInfos, refresh } = useWindowList();
    const [activeHandle, setActiveHandle] = useAtom(activeHandleAtom);

    return (
        <WindowTree
            windowInfos={windowInfos}
            selectedHandle={activeHandle}
            onSelectWindow={setActiveHandle}
            onRefresh={refresh}
        />
    );
}

export function ControlTreeLoader() {
    const controlTree = useAtomValue(controlTreeAtom);
    const activeHandle = useAtomValue(activeHandleAtom);

    async function handleInvoke(control: ControlNode) {
        if (activeHandle && control.runtimeId) {
            console.log("Invoking", control.name);
            await tmApi.invokeControl(activeHandle, control.runtimeId);
        }
    }

    return (
        <Suspense fallback={<div className="p-4 text-muted-foreground">Loading controls...</div>}>
            <ControlTree
                root={controlTree}
                onInvoke={handleInvoke}
            />
        </Suspense>
    );
}
