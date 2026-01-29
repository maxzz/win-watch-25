import { useAtomValue } from "jotai";
import { activeHandleAtom, windowInfosAtom } from "@renderer/store/2-atoms";
import { normalizeHwnd, asHexNumber } from "@renderer/utils";

export function ActiveWindowInfo() {
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
            <div className={panelClasses}>
                No active window selected
            </div>
        );
    }

    return (
        <div className={panelClasses}>
            <div>
                <span className="font-semibold">Handle: </span>
                {normalizeHwnd(activeWindow.handle)}
            </div>

            <div>
                <span className="font-semibold">Process: </span>
                {activeWindow.processName} (PID: {asHexNumber({ value: activeWindow.processId, prefix: true })})
            </div>

            <div>
                <span className="font-semibold">Class: </span>
                {activeWindow.className}
            </div>

            <div className="flex-1 text-right truncate">
                <span className="font-semibold">Title: </span>
                "{activeWindow.title}"
            </div>
        </div>
    );
}

const panelClasses = "px-1 py-2 text-xs bg-muted/20 border-t border-foreground/20 flex items-center gap-2";
