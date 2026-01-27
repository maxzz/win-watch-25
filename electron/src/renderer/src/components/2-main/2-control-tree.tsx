import { useState } from 'react';
import { useAtom } from 'jotai';
import { selectedControlAtom } from '@renderer/store/2-active-window';
import { ControlNode } from '@renderer/types';
import { ChevronRight, ChevronDown, Box, MousePointerClick } from 'lucide-react';

export function ControlTree({ root, onInvoke }: {
    root: ControlNode | null;
    onInvoke: (control: ControlNode) => void;
}) {
    const [selectedControl, setSelectedControl] = useAtom(selectedControlAtom);
    if (!root) {
        return (
            <div className="p-4 text-muted-foreground text-center">
                No control tree available
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-card">
            <div className="p-2 border-b bg-muted/20">
                <span className="font-semibold text-sm">
                    Control Hierarchy
                </span>
            </div>

            <div className="flex-1 overflow-auto">
                <ControlTreeNode
                    node={root}
                    selectedNode={selectedControl}
                    onSelect={setSelectedControl}
                    onInvoke={onInvoke}
                    depth={0} />
            </div>
        </div>
    );
}

function ControlTreeNode({ node, selectedNode, onSelect, onInvoke, depth }: {
    node: ControlNode;
    selectedNode: ControlNode | null;
    onSelect: (c: ControlNode) => void;
    onInvoke: (c: ControlNode) => void; depth: number;
}) {
    const [expanded, setExpanded] = useState(true);
    const isSelected = selectedNode === node; // simple reference check, might need ID check
    const hasChildren = node.children && node.children.length > 0;

    return (
        <div>
            <div
                className={`flex items-center py-1 px-2 cursor-pointer hover:bg-accent/50 ${isSelected ? 'bg-accent text-accent-foreground' : ''}`}
                style={{ paddingLeft: `${depth * 12 + 4}px` }}
                onClick={() => onSelect(node)}
            >
                <span
                    className="mr-1 w-4 h-4 flex items-center justify-center"
                    onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                >
                    {hasChildren && (expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
                </span>

                <Box size={14} className="mr-2 text-blue-500" />

                <span className="truncate text-sm" title={node.name}>
                    {node.controlType} {node.name ? `"${node.name}"` : ""}
                </span>

                {isSelected && (
                    <button
                        className="ml-auto p-1 hover:bg-background rounded"
                        title="Invoke"
                        onClick={(e) => { e.stopPropagation(); onInvoke(node); }}
                    >
                        <MousePointerClick size={12} />
                    </button>
                )}
            </div>

            {expanded && hasChildren && (
                <div>
                    {node.children!.map(
                        (child, i) => (
                            <ControlTreeNode
                                key={i}
                                node={child}
                                selectedNode={selectedNode}
                                onSelect={onSelect}
                                onInvoke={onInvoke}
                                depth={depth + 1}
                            />
                        )
                    )}
                </div>
            )}
        </div>
    );
}
