import { useSetAtom } from "jotai";
import { useSnapshot } from "valtio/react";
import { appSettings } from "@renderer/store/1-ui-settings";
import { setAutoHighlightSelectedControlAtom } from "@renderer/store/2-atoms";
import { Label } from "../../ui/shadcn/label";
import { Switch } from "../../ui/shadcn/switch";

export function ControlTreeHeader() {
    const { autoHighlightSelectedControl } = useSnapshot(appSettings);
    const setAutoHighlightSelectedControl = useSetAtom(setAutoHighlightSelectedControlAtom);
    const switchId = "control-tree-auto-highlight";

    return (
        <div className="px-2 py-1 border-b bg-muted/20 flex items-center select-none">
            <span className="text-xs font-semibold">
                Control Hierarchy
            </span>

            <div className="ml-auto flex items-center gap-2">
                <Label
                    htmlFor={switchId}
                    className="text-[11px] font-normal text-muted-foreground cursor-pointer"
                    title="Auto highlight the selected control"
                >
                    Auto-highlight
                </Label>
                <Switch
                    id={switchId}
                    checked={autoHighlightSelectedControl}
                    onCheckedChange={(checked) => setAutoHighlightSelectedControl(checked)}
                />
            </div>
        </div>
    );
}
