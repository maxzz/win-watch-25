import { useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { classNames } from "@renderer/utils";
import { appSettings } from "@renderer/store/1-ui-settings";
import { PanelBottomIcon, PanelRightIcon } from "lucide-react";
import { Button } from "../ui/shadcn/button";
import { doRefreshWindowInfosAtom } from "@renderer/store/2-atoms";
import { IconRefresh } from "../ui/icons";

export function AppHeader({ className }: { className?: string; }) {
    return (
        <div className={classNames("px-3 py-1 border-b bg-muted/30 flex items-center justify-between", className)}>
            <div className="flex items-center gap-4">
                <span className="text-xs font-medium" title="Windows UI Automation Monitor">
                    UI Automation Monitor
                </span>
                <Button_WindowTreeRefresh />
            </div>
            <Button_TogglePropertiesPosition />
        </div>
    );
}

function Button_TogglePropertiesPosition() {
    const settings = useSnapshot(appSettings);
    const isPropertiesOnRight = settings.propertiesPanelPosition === 'right';
    return (
        <Button
            variant="outline"
            size="xs"
            onClick={() => appSettings.propertiesPanelPosition = settings.propertiesPanelPosition === 'bottom' ? 'right' : 'bottom'}
            title={isPropertiesOnRight ? "Move properties panel to bottom" : "Move properties panel to right"}
        >
            {isPropertiesOnRight ? <PanelBottomIcon className="size-4" /> : <PanelRightIcon className="size-4" />}
        </Button>
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
