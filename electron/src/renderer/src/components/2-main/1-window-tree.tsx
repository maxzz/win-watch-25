import { useState } from 'react';
import { type WindowInfo } from '@renderer/types';
import { ChevronRight as IconChevronRight, ChevronDown as IconChevronDown, Monitor as IconMonitor } from 'lucide-react';

export function WindowTree({ windows, selectedHandle, onSelectWindow, onRefresh }: {
    windows: WindowInfo[];
    selectedHandle: string | null;
    onSelectWindow: (handle: string) => void;
    onRefresh: () => void;
}) {
    return (
        <div className="flex flex-col h-full border-r bg-card">
            <div className="p-2 border-b flex justify-between items-center bg-muted/20">
                <span className="font-semibold text-sm">
                    Windows
                </span>
                <button onClick={onRefresh} className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90">
                    Refresh
                </button>
            </div>

            <div className="flex-1 overflow-auto">
                {windows.map(
                    (w, i) => (
                        <WindowNode key={i} window={w} selectedHandle={selectedHandle} onSelect={onSelectWindow} depth={0} />
                    )
                )}
            </div>
        </div>
    );
}

function WindowNode({ window, selectedHandle, onSelect, depth }: { window: WindowInfo; selectedHandle: string | null; onSelect: (h: string) => void; depth: number; }) {
    const [expanded, setExpanded] = useState(false);
    const isSelected = window.handle === selectedHandle;
    const hasChildren = window.children && window.children.length > 0;

    return (
        <div>
            <div
                className={`px-2 py-0.5 cursor-pointer hover:bg-accent/50 flex items-center ${isSelected ? 'bg-accent text-accent-foreground' : ''}`}
                style={{ paddingLeft: `${depth * 12 + 4}px` }}
                onClick={() => onSelect(window.handle)}
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

                <span className="text-xs truncate" title={window.title || "No Title"}>
                    <span className="ml-1 text-xs text-muted-foreground">
                        {window.handle}
                    </span>
                    {window.title || `[${window.processName}]`}
                </span>
            </div>

            {expanded && hasChildren && (
                <div>
                    {window.children!.map(
                        (child, i) => (
                            <WindowNode key={i} window={child} selectedHandle={selectedHandle} onSelect={onSelect} depth={depth + 1} />
                        )
                    )}
                </div>
            )}
        </div>
    );
}
