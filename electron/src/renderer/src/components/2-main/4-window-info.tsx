import { type WindowInfo as WindowInfoType } from "@renderer/types";

export function WindowInfo({ window }: { window: WindowInfoType | null }) {
    if (!window) {
        return (
            <div className="p-2 border-b text-sm text-muted-foreground">
                No active window selected
            </div>
        );
    }

    return (
        <div className="p-2 border-b bg-muted/10 flex gap-4 text-sm">
            <div><span className="font-semibold">Handle:</span> {window.handle}</div>
            <div><span className="font-semibold">Process:</span> {window.processName} ({window.processId})</div>
            <div><span className="font-semibold">Class:</span> {window.className}</div>
            <div className="flex-1 text-right truncate"><span className="font-semibold">Title:</span> {window.title}</div>
        </div>
    );
}
