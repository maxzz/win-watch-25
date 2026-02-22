import { useAtomValue, useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { appSettings } from "@renderer/store/1-ui-settings";
import { Crosshair } from "lucide-react";
import { Button } from "../../ui/shadcn/button";
import { Label } from "../../ui/shadcn/label";
import { Switch } from "../../ui/shadcn/switch";
import { IconRefresh, Symbol_uia_Toolbar, Symbol_uia_Tooltip, Symbol_uia_Tooltip2 } from "../../ui/icons";
import { doHighlightSelectedWindowAtom, doRefreshWindowInfosAtom, selectedHwndAtom } from "@renderer/store/2-atoms";

export function WindowTreeHeader() {
    return (
        <div className="px-2 py-1 bg-muted/20 border-b flex justify-between items-center select-none">
            <span className="text-xs font-semibold">
                Windows
            </span>
            <div className="flex items-center gap-1">
                <Button_WindowTreeRefresh />
                <Button_ToggleActiveWindowMonitoring />
                <Button_HighlightSelectedWindow />

                <Symbol_uia_Toolbar className="size-3.5" />
                <Symbol_uia_Tooltip className="size-3.5" />
                <Symbol_uia_Tooltip2 className="size-3.5" />
            </div>
        </div>
    );
}

function Button_WindowTreeRefresh() {
    const refreshWindowInfos = useSetAtom(doRefreshWindowInfosAtom);
    return (
        <Button
            variant="outline"
            size="xs"
            onClick={refreshWindowInfos}
            title="Refresh window list (refresh window tree)"
        >
            <IconRefresh className="size-3.5" />
        </Button>
    );
}

function Button_ToggleActiveWindowMonitoring() {
    const settings = useSnapshot(appSettings);
    const enabled = settings.activeWindowMonitoringEnabled;
    const switchId = "window-tree-follow-focus";
    return (
        <div className="flex items-center gap-1.5">
            <Label
                className="text-[11px] font-normal text-muted-foreground cursor-pointer"
                title={enabled ? "Stop following the focused window" : "Follow the focused window"}
            >
                Follow focus
                <Switch
                    checked={enabled}
                    onCheckedChange={(checked) => appSettings.activeWindowMonitoringEnabled = checked}
                />
            </Label>
        </div>
    );
}

function Button_HighlightSelectedWindow() {
    const selectedHwnd = useAtomValue(selectedHwndAtom);
    const doHighlightSelectedWindow = useSetAtom(doHighlightSelectedWindowAtom);
    return (
        <Button
            variant="outline"
            size="xs"
            onClick={doHighlightSelectedWindow}
            disabled={!selectedHwnd}
            title="Highlight selected window"
        >
            <Crosshair className="size-3.5" />
        </Button>
    );
}
