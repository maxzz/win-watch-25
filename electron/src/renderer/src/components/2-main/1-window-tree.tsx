import { useState } from "react";
import { useAtom, useAtomValue } from "jotai";
import { type WindowInfo } from "@renderer/types";
import { ChevronRight as IconChevronRight, ChevronDown as IconChevronDown, Monitor as IconMonitor } from "lucide-react";
import { classNames } from "@renderer/utils";
import { activeHandleAtom, windowInfosAtom } from "@renderer/store/2-atoms";

export function WindowTreePanel() {
    const windowInfos: WindowInfo[] = useAtomValue(windowInfosAtom);
    const [activeHandle, setActiveHandle] = useAtom(activeHandleAtom);

    return (
        <div className="h-full bg-card border-r flex flex-col">
            <div className="p-2 bg-muted/20 border-b flex justify-between items-center">
                <span className="text-sm font-semibold">
                    Windows
                </span>
            </div>

            <div className="flex-1 overflow-auto">
                {windowInfos.map(
                    (windowInfo, i) => (
                        <WindowNode key={i} windowInfo={windowInfo} selectedHandle={activeHandle} onSelect={setActiveHandle} depth={0} />
                    )
                )}
            </div>
        </div>
    );
}

function WindowNode({ windowInfo, selectedHandle, onSelect, depth }: { windowInfo: WindowInfo; selectedHandle: string | null; onSelect: (h: string) => void; depth: number; }) {
    const [expanded, setExpanded] = useState(false);
    const isSelected = windowInfo.handle === selectedHandle;
    const hasChildren = windowInfo.children && windowInfo.children.length > 0;

    return (
        <div>
            <div
                className={classNames("px-2 py-0.5 cursor-pointer flex items-center", isSelected ? "bg-red-500 text-accent-foreground" : "hover:bg-accent/50")}
                style={{ paddingLeft: `${depth * 12 + 4}px` }}
                onClick={() => onSelect(windowInfo.handle)}
            >
                <span
                    className="mr-1 size-4 flex items-center justify-center"
                    onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                >
                    {hasChildren && (expanded
                        ? <IconChevronDown className="size-3.5" />
                        : <IconChevronRight className="size-3.5" />
                    )}
                </span>

                <IconMonitor className="shrink-0 mr-0.5 size-3.5 text-muted-foreground" />

                <span className="text-xs truncate" title={windowInfo.title || "No Title"}>
                    {/* <span className="ml-1 text-xs text-muted-foreground">
                        {window.handle}
                    </span> */}
                    {windowInfo.title || `[${windowInfo.processName}]`}
                </span>
            </div>

            {expanded && hasChildren && (
                <div>
                    {windowInfo.children!.map(
                        (child, i) => (
                            <WindowNode key={i} windowInfo={child} selectedHandle={selectedHandle} onSelect={onSelect} depth={depth + 1} />
                        )
                    )}
                </div>
            )}
        </div>
    );
}
