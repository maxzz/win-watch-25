import { useAtomValue } from "jotai";
import { selectedControlAtom } from "@renderer/store/2-active-window";

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
        <div className="h-full flex flex-col border-t bg-card">
            <div className="p-2 border-b bg-muted/20 font-semibold text-sm">Properties</div>
            <div className="flex-1 overflow-auto p-0">
                <table className="w-full text-sm">
                    <tbody>
                        {properties.map(
                            (prop, i) => (
                                <tr key={i} className="border-b hover:bg-muted/30">
                                    <td className="p-2 font-medium text-muted-foreground w-1/3 border-r">{prop.label}</td>
                                    <td className="p-2 break-all">{prop.value || <span className="text-muted-foreground italic">empty</span>}</td>
                                </tr>
                            )
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
