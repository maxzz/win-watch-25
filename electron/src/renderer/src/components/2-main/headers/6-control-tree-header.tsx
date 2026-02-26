import { useAtomValue, useSetAtom } from "jotai";
import { useSnapshot } from "valtio/react";
import { appSettings } from "@renderer/store/1-ui-settings";
import { selectedHwndAtom } from "@renderer/store/2-1-atoms-windows-list";
import { refreshWindowControlsTreeAtom } from "@renderer/store/2-2-atoms-controls-list";
import { setAutoHighlightSelectedControlAtom } from "@renderer/store/2-3-atoms-highlight";
import { Button } from "../../ui/shadcn/button";
import { Label } from "../../ui/shadcn/label";
import { Switch } from "../../ui/shadcn/switch";
import { IconRefresh } from "../../ui/icons";

export function ControlTreeHeader() {
    return (
        <div className="px-2 py-1 pr-0 h-7 border-b bg-muted/20 flex items-center justify-between select-none">
            <span className="text-xs font-semibold">
                Control Hierarchy
            </span>

            <div className="flex items-center gap-0">
                <ControlTreeAutoHighlightToggle />
                <Button_RefreshControlsTree />
            </div>
        </div>
    );
}

function Button_RefreshControlsTree() {
    const selectedHwnd = useAtomValue(selectedHwndAtom);
    const refreshControlsTree = useSetAtom(refreshWindowControlsTreeAtom);

    return (
        <Button
            variant="ghost"
            size="xs"
            onClick={() => void refreshControlsTree({ force: true })}
            title="Refresh controls tree"
            disabled={!selectedHwnd}
        >
            <IconRefresh className="size-3" />
        </Button>
    );
}

function ControlTreeAutoHighlightToggle() {
    const { autoHighlightSelectedControl } = useSnapshot(appSettings);
    const setAutoHighlightSelectedControl = useSetAtom(setAutoHighlightSelectedControlAtom);

    return (
        <Label className="text-xs font-normal text-muted-foreground cursor-pointer gap-0" title="Auto highlight the selected control">
            <span className="pb-0.5">Auto-highlight:</span>
            <Switch
                className="scale-75"
                checked={autoHighlightSelectedControl}
                onCheckedChange={(checked) => setAutoHighlightSelectedControl(checked)}
            />
        </Label>
    );
}
