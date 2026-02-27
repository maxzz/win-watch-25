import { atom } from "jotai";
import { getControlTypeName } from "@renderer/utils/uia/0-uia-control-type-names";
import { uuid } from "../utils/uuid";
import { type ControlNode } from "./9-types-tmapi";

export type RawControlNode = Omit<ControlNode, "nodeUuid" | "expandedAtom" | "children"> & {
    children?: RawControlNode[];
};

function getControlNodeUniqueId(node: ControlNode): number {
    return node.nodeUuid; //TODO: OK, I was wrong nodeUuid will be different from render to render. May be switch to runtimeId?
}

function getDefaultExpandedState(node: RawControlNode): boolean {
    return getControlTypeName(node.controlType) !== "ScrollBar";
}

export function collectNodeUuidByPath(
    node: ControlNode,
    path: string = "0",
    out: Map<string, number> = new Map<string, number>()
): Map<string, number> {
    out.set(path, node.nodeUuid);
    node.children?.forEach((child, index) => collectNodeUuidByPath(child, `${path}.${index}`, out));
    return out;
}

// Collect the expanded state of each control node by unique ID.
export function collectExpandedStateByUniqueId(get: Getter, node: ControlNode, out: Map<number, boolean> = new Map<number, boolean>()): Map<number, boolean> {
    const uniqueId = getControlNodeUniqueId(node);
    if (!out.has(uniqueId)) {
        out.set(uniqueId, get(node.expandedAtom));
    }
    for (const child of node.children ?? []) {
        collectExpandedStateByUniqueId(get, child, out);
    }
    return out;
}

// Restore the expanded state of each control node by unique ID.
export function withExpandedAtom(
    node: RawControlNode,
    expandedStateByUniqueId?: Map<number, boolean>,
    nodeUuidByPath?: Map<string, number>,
    path: string = "0"
): ControlNode {
    const nodeUuid = nodeUuidByPath?.get(path) ?? uuid.asRelativeNumber();
    const restoredExpanded = expandedStateByUniqueId?.get(nodeUuid);
    return {
        ...node,
        nodeUuid,
        expandedAtom: atom(restoredExpanded ?? getDefaultExpandedState(node)),
        children: node.children?.map((child, index) => withExpandedAtom(child, expandedStateByUniqueId, nodeUuidByPath, `${path}.${index}`)),
    };
}
