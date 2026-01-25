import React, { useState } from 'react';
import { type WindowInfo } from '@renderer/types';
import { ChevronRight, ChevronDown, Monitor } from 'lucide-react';

export function WindowTree({ windows, selectedHandle, onSelectWindow, onRefresh }: {
    windows: WindowInfo[];
    selectedHandle: string | null;
    onSelectWindow: (handle: string) => void;
    onRefresh: () => void;
}) {
    return (
        <div className="flex flex-col h-full border-r bg-card">
            <div className="p-2 border-b flex justify-between items-center bg-muted/20">
                <span className="font-semibold text-sm">Windows</span>
                <button onClick={onRefresh} className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90">
                    Refresh
                </button>
            </div>
            <div className="flex-1 overflow-auto">
                {windows.map((w, i) => (
                    <WindowNode key={i} window={w} selectedHandle={selectedHandle} onSelect={onSelectWindow} depth={0} />
                ))}
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
                className={`flex items-center py-1 px-2 cursor-pointer hover:bg-accent/50 ${isSelected ? 'bg-accent text-accent-foreground' : ''}`}
                style={{ paddingLeft: `${depth * 12 + 4}px` }}
                onClick={() => onSelect(window.handle)}
            >
                <span
                    className="mr-1 w-4 h-4 flex items-center justify-center"
                    onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                >
                    {hasChildren && (expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
                </span>
                <Monitor size={14} className="mr-2 text-muted-foreground" />
                <span className="truncate text-sm" title={window.title || "No Title"}>
                    {window.title || `[${window.processName}]`} <span className="text-xs text-muted-foreground ml-1">({window.handle})</span>
                </span>
            </div>
            {expanded && hasChildren && (
                <div>
                    {window.children!.map((child, i) => (
                        <WindowNode key={i} window={child} selectedHandle={selectedHandle} onSelect={onSelect} depth={depth + 1} />
                    ))}
                </div>
            )}
        </div>
    );
}
