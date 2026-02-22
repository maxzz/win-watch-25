import { type ReactNode } from "react";
import { useAtomValue } from "jotai";
import { useSnapshot } from "valtio/react";
import { asHex, classNames, normalizeHwnd } from "@renderer/utils";
import { formatControlType } from "@renderer/utils/uia/0-uia-control-type-names";
import { appSettings } from "@renderer/store/1-ui-settings";
import { type ControlNode } from "@renderer/store/9-tmapi-types";
import { selectedControlAtom } from "@renderer/store/2-atoms";
import { PropertiesPanelHeader } from "./headers/7-properties-panel-header";

export function PropertiesPanel() {
    const control = useAtomValue(selectedControlAtom);

    const { propertiesPanelPosition } = useSnapshot(appSettings);
    const isPropertiesOnRight = propertiesPanelPosition === 'right';

    if (!control) {
        return (
            <div className="h-full text-xs text-muted-foreground bg-muted/10">
                <div className="flex flex-col">
                    <PropertiesPanelHeader />
                    <div className="px-2 flex-1 text-muted-foreground">
                        Select a control to view properties
                    </div>
                </div>
            </div>
        );
    }

    const properties = getControlProperties(control);

    return (
        <div className={classNames("h-full bg-card flex flex-col", isPropertiesOnRight ? "" : "border-t")}>
            <PropertiesPanelHeader />

            <div className="flex-1 overflow-auto">
                <div className="text-xs grid grid-cols-[auto_1fr]">
                    {properties.map(
                        (prop, idx) => {
                            const nameValue = prop.label === "Bounds" ? boundsValue(strOnly(prop.value)) : prop.value;
                            return (
                                <div className="contents border-b hover:bg-muted/30" key={idx}>
                                    <div className="px-1.5 py-px border-r cursor-default select-none" title={prop.label}>
                                        {prop.label}
                                    </div>
                                    <div className="px-1.5 py-px break-all truncate cursor-default" title={prop.title || strEmpty(prop.value)}>
                                        {nameValue || (
                                            <span className="text-muted-foreground italic">
                                                -
                                            </span>)
                                        }
                                    </div>
                                </div>
                            );
                        }
                    )}
                </div>
            </div>
        </div>
    );
}

function getControlProperties(control: ControlNode): Array<{ label: string; value: ReactNode; title?: string; }> {
    const legacyItems = control.isLegacyIAccessiblePatternAvailable
        ? [
            { label: "Legacy IAccessible Available", value: "true" },
            { label: "Legacy CurrentRole", value: String(control.currentRole) },
            { label: "Legacy CurrentState", value: formatHex(control.currentState) }
        ]
        : [{ label: "Legacy IAccessible Available", value: "false" }];

    return [
        { label: "Process ID", value: asHex({ value: String(control.processId), prefix: true }), title: `decimal: ${String(control.processId)}` },
        { label: "Framework ID", value: <span className="-ml-1 px-1 text-foreground bg-sky-100 dark:bg-sky-900 border border-sky-300 dark:border-sky-700 rounded">{control.frameworkId}</span> },
        { label: "Native Window Handle", value: normalizeHwnd(control.nativeWindowHandle) },
        { label: "Class Name", value: control.className },
        { label: "Control Type", value: formatControlType(control.controlType) },
        { label: "Localized Control Type", value: control.localizedControlType },
        { label: "Name", value: control.name },
        { label: "Automation ID", value: control.automationId },
        { label: "Runtime ID", value: control.runtimeId },
        { label: "Enabled", value: String(control.isEnabled) },
        { label: "Visible", value: String(control.isVisible) },
        { label: "Bounds", value: control.bounds ? `[${control.bounds.left}, ${control.bounds.top}, ${control.bounds.right}, ${control.bounds.bottom}]` : "N/A" },
        ...legacyItems
    ];
}

function formatHex(value: number): string {
    if (!Number.isFinite(value)) return "";
    if (value === 0) return "0x0";
    return `0x${(value >>> 0).toString(16).toUpperCase()}`;
}

function boundsValue(boundsStr?: string): string {
    if (!boundsStr) {
        return '';
    }
    const bounds = boundsStr.slice(1, -1).split(",").map(Number); // remove [] and split into l, t, r, b
    const [left, top, right, bottom] = bounds;
    return `l:${left}, t:${top}, r:${right}, b:${bottom}`; // the same style as in the Microsoft Inspector
}

function strOnly(value: ReactNode): string {
    if (typeof value === 'string') {
        return value;
    }
    throw new Error(`Unsupported value type: ${typeof value}`);
}

function strEmpty(value: ReactNode): string {
    if (typeof value === 'string') {
        return value;
    }
    return "";
}
