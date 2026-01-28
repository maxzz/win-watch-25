import { useAtomValue } from "jotai";
import { selectedControlAtom } from "@renderer/store/2-atoms";

export function PropertiesPanel() {
    const control = useAtomValue(selectedControlAtom);

    if (!control) {
        return (
            <div className="h-full p-4 flex items-center justify-center text-muted-foreground bg-muted/10">
                Select a control to view properties
            </div>
        );
    }

    const properties = [
        { label: "Name", value: control.name },
        { label: "Control Type", value: control.controlType },
        { label: "Automation ID", value: control.automationId },
        { label: "Class Name", value: control.className },
        { label: "Runtime ID", value: control.runtimeId },
        { label: "Enabled", value: String(control.isEnabled) },
        { label: "Visible", value: String(control.isVisible) },
        { label: "Bounds", value: control.bounds ? `[${control.bounds.x}, ${control.bounds.y}, ${control.bounds.width}, ${control.bounds.height}]` : "N/A" }
    ];

    return (
        <div className="h-full bg-card border-t flex flex-col">
            <div className="p-2 text-xs font-semibold border-b bg-muted/20">
                Properties
            </div>

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
