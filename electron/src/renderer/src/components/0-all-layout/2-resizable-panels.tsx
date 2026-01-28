import { useCallback } from "react";
import { useSnapshot } from "valtio";
import { appSettings } from "@renderer/store/1-ui-settings";
import { WindowTreePanel, ControlTreeLoader } from "../2-main/0-panel-loaders";
import { PropertiesPanel } from "../2-main/3-properties-panel";
import { WindowInfo } from "../2-main/4-window-info";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "../ui/shadcn/resizable";

export function MainContent({ className }: { className?: string; }) {
    const settings = useSnapshot(appSettings);

    const handleMainPanelResize = useCallback((layout: readonly number[]) => {
        appSettings.mainPanelSize = layout[0];
    }, []);

    const handleControlPanelResize = useCallback((layout: readonly number[]) => {
        appSettings.controlPanelSize = layout[0];
    }, []);

    const isPropertiesOnRight = settings.propertiesPanelPosition === 'right';

    return (
        <ResizablePanelGroup className={className} orientation="horizontal" onLayoutChange={handleMainPanelResize}>
            {/* Left panel - Window Tree */}
            <ResizablePanel id="left-panel" minSize="15px" maxSize="75%" defaultSize={settings.mainPanelSize}>
                <WindowTreePanel />
            </ResizablePanel>

            <ResizableHandle />

            {/* Right panel - Window Info, Control Tree, Properties */}
            <ResizablePanel id="right-panel" defaultSize={100 - settings.mainPanelSize} minSize="50px">
                <div className="flex flex-col h-full">
                    <WindowInfo />

                    <ResizablePanelGroup
                        className="flex-1"
                        orientation={isPropertiesOnRight ? "horizontal" : "vertical"}
                        onLayoutChange={handleControlPanelResize}
                    >
                        {/* Control Tree */}
                        <ResizablePanel id="controls-panel" minSize="20px" defaultSize={settings.controlPanelSize}>
                            <div className="h-full overflow-auto">
                                <ControlTreeLoader />
                            </div>
                        </ResizablePanel>

                        <ResizableHandle />

                        {/* Properties Panel */}
                        <ResizablePanel id="control-props-panel" minSize="15px" defaultSize={100 - settings.controlPanelSize}>
                            <PropertiesPanel />
                        </ResizablePanel>
                    </ResizablePanelGroup>
                </div>
            </ResizablePanel>
        </ResizablePanelGroup>
    );
}
