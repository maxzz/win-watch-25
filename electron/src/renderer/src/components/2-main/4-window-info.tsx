import { useAtomValue } from "jotai";
import { activeHandleAtom, windowInfosAtom } from "@renderer/store/2-active-window";

export function WindowInfo() {
    const windowInfos = useAtomValue(windowInfosAtom);
    const activeHandle = useAtomValue(activeHandleAtom);

    // Find window info for active handle
    // This might be slow if list is huge, but fine for now
    // Also handle format mismatch (hex vs dec) might be an issue
    // I'll try to fuzzy match or normalized in the future
    const activeWindow =
        windowInfos.find(w => w.handle == activeHandle) ||
        windowInfos.find(w => parseInt(w.handle) == parseInt(activeHandle || "0")) ||
        null;

    if (!activeWindow) {
        return (
            <div className="p-2 text-xs text-muted-foreground border-b">
                No active window selected
            </div>
        );
    }

    return (
        <div className="p-2 text-xs border-b bg-muted/10 flex gap-4">
            <div>
                <span className="font-semibold">Handle:</span>
                {activeWindow.handle}
            </div>
            <div>
                <span className="font-semibold">Process:</span>
                {activeWindow.processName} ({activeWindow.processId})
            </div>
            <div>
                <span className="font-semibold">Class:</span>
                {activeWindow.className}
            </div>
            <div className="flex-1 text-right truncate">
                <span className="font-semibold">Title:</span>
                {activeWindow.title}
            </div>
        </div>
    );
}
