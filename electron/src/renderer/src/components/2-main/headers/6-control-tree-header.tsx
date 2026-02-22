import { useSetAtom } from "jotai";
import { useSnapshot } from "valtio/react";
import { appSettings } from "@renderer/store/1-ui-settings";
import { setAutoHighlightSelectedControlAtom } from "@renderer/store/2-atoms";
import { Label } from "../../ui/shadcn/label";
import { Switch } from "../../ui/shadcn/switch";

export function ControlTreeHeader() {
    const { autoHighlightSelectedControl } = useSnapshot(appSettings);
    const setAutoHighlightSelectedControl = useSetAtom(setAutoHighlightSelectedControlAtom);

    return (
        <div className="px-2 py-1 border-b bg-muted/20 flex items-center select-none">
            <span className="text-xs font-semibold">
                Control Hierarchy
            </span>

            <div className="ml-auto flex items-center gap-2">
                <Label className="text-xs font-normal text-muted-foreground cursor-pointer gap-0" title="Auto highlight the selected control">
                    <span className="pb-0.5">Auto-highlight:</span>
                    <Switch
                        className="scale-75"
                        checked={autoHighlightSelectedControl}
                        onCheckedChange={(checked) => setAutoHighlightSelectedControl(checked)}
                    />
                </Label>
            </div>
        </div>
    );
}
