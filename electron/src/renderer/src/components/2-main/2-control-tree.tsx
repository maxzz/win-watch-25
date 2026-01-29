import { useState, Suspense } from "react";
import { useAtom, useAtomValue } from "jotai";
import { selectedControlAtom, activeHandleAtom, controlTreeAtom } from "@renderer/store/2-atoms";
import { ControlNode } from "@renderer/types";
import { ChevronRight, ChevronDown, MousePointerClick } from "lucide-react";
import { getControlTypeName } from "@renderer/utils/uia-control-types";
import { getControlTypeIcon } from "@renderer/utils/uia-control-type-icons";

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

function ControlTree({ root, onInvoke }: { root: ControlNode | null; onInvoke: (control: ControlNode) => void; }) {
    const [selectedControl, setSelectedControl] = useAtom(selectedControlAtom);
    if (!root) {
        return (
            <div className="p-4 text-center text-muted-foreground">
                No control tree available
            </div>
        );
    }

    return (
        <div className="h-full bg-card flex flex-col">
            <div className="p-2 border-b bg-muted/20">
                <span className="text-sm font-semibold">
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

    const ControlIcon = getControlTypeIcon(node.controlType);

    return (
        <div>
            <div
                className={`px-2 h-5 hover:bg-accent/50 cursor-pointer flex items-center ${isSelected ? 'bg-accent text-accent-foreground' : ''}`}
                style={{ paddingLeft: `${depth * 20 + 4}px` }}
                onClick={() => onSelect(node)}
            >
                <span
                    className="mr-1 size-4 flex items-center justify-center"
                    onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                >
                    {hasChildren && (expanded
                        ? <ChevronDown className="size-3.5" />
                        : <ChevronRight className="size-3.5" />
                    )}
                </span>

                <ControlIcon size={14} className="mr-2 text-blue-500" />

                <span className="text-xs truncate" title={node.name}>
                    {getControlTypeName(node.controlType)} {node.name ? `"${node.name}"` : ""}
                </span>

                {isSelected && (
                    <button
                        className="ml-auto p-1 hover:bg-background rounded"
                        title="Invoke"
                        onClick={(e) => { e.stopPropagation(); onInvoke(node); }}
                    >
                        <MousePointerClick className="size-3" />
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
