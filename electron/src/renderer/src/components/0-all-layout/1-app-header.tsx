import { useSnapshot } from "valtio";
import { classNames } from "@renderer/utils";
import { appSettings } from "@renderer/store/1-ui-settings";
import { PanelBottomIcon, PanelRightIcon } from "lucide-react";
import { Button } from "../ui/shadcn/button";

export function AppHeader({ className }: { className?: string; }) {
    return (
        <div className={classNames("px-3 py-1 border-b bg-muted/30 flex items-center justify-between", className)}>
            <div className="flex items-center gap-4">
                <span className="text-xs font-medium" title="Windows UI Automation Monitor">
                    UI Automation Monitor
                </span>
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
