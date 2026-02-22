import { useAtomValue } from "jotai";
import { activeHwndAtom, windowInfosAtom } from "@renderer/store/2-atoms";
import { normalizeHwnd, asHexNumber } from "@renderer/utils";

export function ActiveWindowInfo() {
    const windowInfos = useAtomValue(windowInfosAtom);
    const activeHwnd = useAtomValue(activeHwndAtom);

    // Find window info for active handle
    // This might be slow if list is huge, but fine for now
    // Also handle format mismatch (hex vs dec) might be an issue
    // I'll try to fuzzy match or normalized in the future
    const activeWindow =
        windowInfos.find(w => w.handle == activeHwnd) ||
        windowInfos.find(w => parseInt(w.handle) == parseInt(activeHwnd || "0")) ||
        null;

    //console.log("ActiveWindowInfo", activeHandle, activeWindow, windowInfos);

    if (!activeWindow) {
        return (
            <div className={panelClasses}>
                No active window selected
            </div>
        );
    }

    return (
        <div className={panelClasses}>
            <div className="min-w-[132px]">
                <span className="font-semibold">HWND: </span>
                {normalizeHwnd(activeWindow.handle)}
            </div>

            <div>
                <span className="font-semibold">PID: </span>
                {asHexNumber({ value: activeWindow.processId, prefix: true })} ({activeWindow.processName})
            </div>

            <div>
                <span className="font-semibold">class: </span>
                {activeWindow.className}
            </div>

            {/* <div className="flex-1 text-right truncate">
                <span className="font-semibold">Title: </span>
                "{activeWindow.title}"
            </div> */}
        </div>
    );
}

const panelClasses = "px-1 py-2 text-[.65rem] bg-muted/20 border-t border-foreground/20 flex items-center gap-2";
