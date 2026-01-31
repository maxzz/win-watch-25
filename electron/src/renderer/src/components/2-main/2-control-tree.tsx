import { useState, Suspense } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { selectedControlAtom, doGetWindowControlsTreeAtom, doInvokeControlAtom } from "@renderer/store/2-atoms";
import { ControlNode } from "@renderer/store/9-tmapi-types";
import { ChevronRight, ChevronDown, MousePointerClick } from "lucide-react";
import { getControlTypeName } from "@renderer/utils/uia/0-uia-control-type-names";
import { getControlTypeIcon } from "@renderer/utils/uia/1-uia-control-type-icons-svg";
import { ControlTreeHeader } from "./headers/6-control-tree-header";

export function ControlTreeLoader() {
    const windowControlsTree = useAtomValue(doGetWindowControlsTreeAtom);
    return (
        <Suspense fallback={<div className="p-4 text-muted-foreground">Loading controls...</div>}>
            {!windowControlsTree
                ? (
                    <div className="p-4 text-center text-muted-foreground">
                        No control tree available
                    </div>
                ) : (
                    <ControlTree windowControlsTree={windowControlsTree} />
                )
            }
        </Suspense>
    );
}

function ControlTree({ windowControlsTree }: { windowControlsTree: ControlNode; }) {
    return (
        <div className="h-full bg-card flex flex-col">
            <ControlTreeHeader />

            <div className="flex-1 overflow-auto">
                <ControlTreeNode node={windowControlsTree} depth={0} />
            </div>
        </div>
    );
}

function ControlTreeNode({ node, depth }: { node: ControlNode; depth: number; }) {

    const [selectedControl, setSelectedControl] = useAtom(selectedControlAtom);
    const invokeControl = useSetAtom(doInvokeControlAtom);

    const [expanded, setExpanded] = useState(true);

    const isSelected = selectedControl === node; // simple reference check, might need ID check
    const hasChildren = node.children && node.children.length > 0;

    const controlIcon = getControlTypeIcon(node.controlType);

    return (<>
        <div
            className={`px-2 h-5 hover:bg-accent/50 cursor-pointer flex items-center ${isSelected ? 'bg-accent text-accent-foreground' : ''}`}
            style={{ paddingLeft: `${depth * 15 + 4}px` }}
            onClick={() => setSelectedControl(node)}
        >
            <span className="shrink-0 mr-1 size-4 flex items-center justify-center" onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}>
                {hasChildren && (
                    expanded
                        ? <ChevronDown className="size-3.5" />
                        : <ChevronRight className="size-3.5" />
                )}
            </span>

            {controlIcon}

            <span className="ml-1 text-xs truncate" title={node.name}>
                {getControlTypeName(node.controlType)} {node.name ? `"${node.name}"` : ""}
            </span>

            {isSelected && (
                <button className="ml-auto p-1 hover:bg-background rounded" onClick={(e) => { e.stopPropagation(); invokeControl(node); }} title="Invoke">
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
                            depth={depth + 1}
                        />
                    )
                )}
            </div>
        )}
    </>);
}
