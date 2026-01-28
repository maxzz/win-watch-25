import { useCallback } from "react";
import { useSnapshot } from "valtio";
import { classNames } from "@renderer/utils";
import { appSettings } from "@renderer/store/1-ui-settings";
import { PanelBottomIcon, PanelRightIcon } from "lucide-react";
import { Button } from "../ui/shadcn/button";

export function Header({ className }: { className?: string; }) {
    const settings = useSnapshot(appSettings);

    const togglePropertiesPosition = useCallback(() => {
        appSettings.propertiesPanelPosition = settings.propertiesPanelPosition === 'bottom' ? 'right' : 'bottom';
    }, [settings.propertiesPanelPosition]);

    const isPropertiesOnRight = settings.propertiesPanelPosition === 'right';

    return (
        <div className={classNames("px-3 py-1.5 border-b bg-muted/30 flex items-center justify-between", className)}>
            <span className="text-sm font-medium">
                Windows UI Automation Monitor
            </span>

            <Button
                variant="ghost"
                size="icon-sm"
                onClick={togglePropertiesPosition}
                title={isPropertiesOnRight ? "Move properties panel to bottom" : "Move properties panel to right"}
            >
                {isPropertiesOnRight ? <PanelBottomIcon className="size-4" /> : <PanelRightIcon className="size-4" />}
            </Button>
        </div>
    );
}
