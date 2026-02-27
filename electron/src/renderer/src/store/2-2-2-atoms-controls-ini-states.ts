import { atom, type PrimitiveAtom } from "jotai";
import { getControlTypeName } from "@renderer/utils/uia/0-uia-control-type-names";
import { uuid } from "../utils/uuid";
import { type ControlNode } from "./9-types-tmapi";
import { selectedHwndAtom } from "./2-1-atoms-windows-list";
import { cachedWindowControlsTreeFamily } from "./2-2-3-atoms-cache";

export type RawControlNode = Omit<ControlNode, "nodeUuid" | "expandedAtom" | "children"> & {
    children?: RawControlNode[];
};

export const initializeControlTreeForHwndAtom = atom(
    null,
    (get, set, args: { rawTree: RawControlNode; selectedHwnd: string; }): { tree: ControlNode; shouldContinue: boolean; } => {
        const cachedTreeAtom = cachedWindowControlsTreeFamily(args.selectedHwnd);

        const previousTreeForHwnd = get(cachedTreeAtom);
        const tree = buildInitializedControlTree(get, args.rawTree, previousTreeForHwnd);

        // Guard against race conditions: if the selection changed while we were fetching, don't overwrite the tree for the new selection.
        if (get(selectedHwndAtom) !== args.selectedHwnd) {
            return { tree, shouldContinue: false };
        }
        set(cachedTreeAtom, tree);

        return { tree, shouldContinue: true };
    }
);

function buildInitializedControlTree(get: Getter, rawTree: RawControlNode, previousTreeForHwnd: ControlNode | null): ControlNode {
    const expandedStateByUniqueId =
        previousTreeForHwnd
            ? collectExpandedStateByUniqueId(get, previousTreeForHwnd)
            : undefined;
    const nodeUuidByPath =
        previousTreeForHwnd
            ? collectNodeUuidByPath(previousTreeForHwnd)
            : undefined;
    return withExpandedAtom(rawTree, expandedStateByUniqueId, nodeUuidByPath);
}

// Collect the expanded state of each control node by unique ID.
function collectExpandedStateByUniqueId(get: Getter, node: ControlNode, out: Map<number, boolean> = new Map<number, boolean>()): Map<number, boolean> {
    const uniqueId = getControlNodeUniqueId(node);
    if (!out.has(uniqueId)) {
        out.set(uniqueId, get(node.expandedAtom));
    }
    for (const child of node.children ?? []) {
        collectExpandedStateByUniqueId(get, child, out);
    }
    return out;
}

// Recursively collect the node UUID by path.
function collectNodeUuidByPath(node: ControlNode, path: string = "0", out: Map<string, number> = new Map<string, number>()): Map<string, number> {
    out.set(path, node.nodeUuid);
    node.children?.forEach((child, index) => collectNodeUuidByPath(child, `${path}.${index}`, out));
    return out;
}

function getControlNodeUniqueId(node: ControlNode): number {
    return node.nodeUuid; //TODO: OK, I was wrong nodeUuid will be different from render to render. May be switch to runtimeId?
}

// Restore the expanded state of each control node by unique ID.
function withExpandedAtom(node: RawControlNode, expandedStateByUniqueId?: Map<number, boolean>, nodeUuidByPath?: Map<string, number>, path: string = "0"): ControlNode {
    const nodeUuid = nodeUuidByPath?.get(path) ?? uuid.asRelativeNumber();
    const restoredExpanded = expandedStateByUniqueId?.get(nodeUuid);
    return {
        ...node,
        nodeUuid,
        expandedAtom: atom(restoredExpanded ?? getDefaultExpandedState(node)),
        children: node.children?.map((child, index) => withExpandedAtom(child, expandedStateByUniqueId, nodeUuidByPath, `${path}.${index}`)),
    };
}

function getDefaultExpandedState(node: RawControlNode): boolean {
    const controlTypeName = getControlTypeName(node.controlType);
    let rvExpanded = true;

    // If Pane and its children only Button without children then collapse the Pane.
    if (controlTypeName === "Pane") {
        if (node.className === "BrowserCaptionButtonContainer" || node.className === "TabStrip") { // This is Chrome caption bar: Minimize, Maximize, Close buttons. and chrome tabs.
            rvExpanded = false;
        }
        else {
            const isOnlyButtons = node.children?.every((child) => !child.children?.length && getControlTypeName(child.controlType) === "Button");
            if (isOnlyButtons) {
                rvExpanded = false;
            }
        }
    }
    else if (controlTypeName === "ToolBar") { // Any ToolBar
        rvExpanded = false;
    }
    else if (controlTypeName === "TabContainerImpl") { // If chrome tabs
        rvExpanded = false;
    }
    else if (controlTypeName === "Tab") {
        if (node.className === "HorizontalTabStripRegionView") { // Chrome top tabs.
            rvExpanded = false;
        }
    }

    // console.log(`getDefaultExpandedState(${node.name}) = ${rvExpanded}`);

    return rvExpanded;
}
