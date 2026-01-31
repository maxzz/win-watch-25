import { useAtomValue } from "jotai";
import { selectedControlAtom } from "@renderer/store/2-atoms";
import { formatControlType } from "@renderer/utils/uia/0-uia-control-type-names";
import { useSnapshot } from "valtio/react";
import { appSettings } from "@renderer/store/1-ui-settings";
import { classNames } from "@renderer/utils";

export function PropertiesPanel() {
    const control = useAtomValue(selectedControlAtom);

    const { propertiesPanelPosition } = useSnapshot(appSettings);
    const isPropertiesOnRight = propertiesPanelPosition === 'right';

    if (!control) {
        return (
            <div className="h-full text-xs text-muted-foreground bg-muted/10">
                <div className="flex flex-col">
                    <Header />
                    <div className="px-2 flex-1 text-muted-foreground">
                        Select a control to view properties
                    </div>
                </div>
            </div>
        );
    }

    const properties = [
        { label: "Name", value: control.name },
        { label: "Control Type", value: formatControlType(control.controlType) },
        { label: "Automation ID", value: control.automationId },
        { label: "Class Name", value: control.className },
        { label: "Runtime ID", value: control.runtimeId },
        { label: "Enabled", value: String(control.isEnabled) },
        { label: "Visible", value: String(control.isVisible) },
        { label: "Bounds", value: control.bounds ? `[${control.bounds.x}, ${control.bounds.y}, ${control.bounds.width}, ${control.bounds.height}]` : "N/A" }
    ];

    return (
        <div className={classNames("h-full bg-card flex flex-col", isPropertiesOnRight ? "" : "border-t")}>
            <Header />

            <div className="flex-1 p-0 overflow-auto">
                <div className="text-xs grid grid-cols-[auto_1fr]">
                    {properties.map(
                        (prop, i) => (
                            <div key={i} className="contents border-b hover:bg-muted/30">
                                <div className="px-2 py-0.5 font-medium text-muted-foreground border-r">{prop.label}</div>
                                <div className="px-2 py-0.5 break-all">{prop.value || <span className="text-muted-foreground italic">empty</span>}</div>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}

function Header() {
    return (
        <div className="px-2 py-1 text-xs font-semibold border-b bg-muted/20">
            Properties
        </div>
    );
}
