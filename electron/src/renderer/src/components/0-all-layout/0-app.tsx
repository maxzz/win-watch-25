import { Suspense, useState, useEffect, useCallback } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { useSnapshot } from 'valtio';
import { useActiveWindow } from '@renderer/store/hooks/useActiveWindow';
import { useWindowList } from '@renderer/store/hooks/useWindowList';
import { activeHandleAtom, controlTreeAtom } from '@renderer/store/2-active-window';
import { appSettings } from '@renderer/store/1-ui-settings';
import { ControlNode } from '@renderer/types';
import { PanelBottomIcon, PanelRightIcon } from 'lucide-react';

import { WindowTree } from '../2-main/1-window-tree';
import { ControlTree } from '../2-main/2-control-tree';
import { PropertiesPanel } from '../2-main/3-properties-panel';
import { WindowInfo } from '../2-main/4-window-info';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '../ui/shadcn/resizable';
import { Button } from '../ui/shadcn/button';

interface ControlTreeLoaderProps {
    selectedControl: ControlNode | null;
    onSelectControl: (control: ControlNode | null) => void;
    onInvoke: (control: ControlNode) => void;
}

function ControlTreeLoader({ selectedControl, onSelectControl, onInvoke }: ControlTreeLoaderProps) {
    const controlTree = useAtomValue(controlTreeAtom);
    return (
        <ControlTree
            root={controlTree}
            selectedControl={selectedControl}
            onSelectControl={onSelectControl}
            onInvoke={onInvoke}
        />
    );
}

export function App() {
    const { windows, refresh } = useWindowList();
    useActiveWindow(null); // Side effects only
    const [activeHandle, setActiveHandle] = useAtom(activeHandleAtom);
    const [selectedControl, setSelectedControl] = useState<ControlNode | null>(null);
    const settings = useSnapshot(appSettings);

    // Find window info for active handle
    // This might be slow if list is huge, but fine for now
    // Also handle format mismatch (hex vs dec) might be an issue
    // I'll try to fuzzy match or normalized in the future
    const activeWindow = windows.find(w => w.handle == activeHandle) || windows.find(w => parseInt(w.handle) == parseInt(activeHandle || "0")) || null;

    useEffect(
        () => {
            // Start monitoring on mount
            tmApi.startMonitoring("0"); // Argument ignored by current C++ impl
            return () => {
                tmApi.stopMonitoring();
            };
        },
        []);

    async function handleInvoke(control: ControlNode) {
        if (activeHandle && control.runtimeId) {
            console.log("Invoking", control.name);
            await tmApi.invokeControl(activeHandle, control.runtimeId);
        }
    }

    const handleMainPanelResize = useCallback((layout: readonly number[]) => {
        appSettings.mainPanelSize = layout[0];
    }, []);

    const handleControlPanelResize = useCallback((layout: readonly number[]) => {
        appSettings.controlPanelSize = layout[0];
    }, []);

    const togglePropertiesPosition = useCallback(() => {
        appSettings.propertiesPanelPosition = settings.propertiesPanelPosition === 'bottom' ? 'right' : 'bottom';
    }, [settings.propertiesPanelPosition]);

    const isPropertiesOnRight = settings.propertiesPanelPosition === 'right';

    return (
        <div className="flex flex-col h-screen w-screen overflow-hidden text-foreground bg-background">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-1.5 border-b bg-muted/30">
                <span className="text-sm font-medium">Windows UI Automation Monitor</span>
                <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={togglePropertiesPosition}
                    title={isPropertiesOnRight ? "Move properties panel to bottom" : "Move properties panel to right"}
                >
                    {isPropertiesOnRight ? <PanelBottomIcon className="size-4" /> : <PanelRightIcon className="size-4" />}
                </Button>
            </div>

            {/* Main content */}
            <ResizablePanelGroup
                orientation="horizontal"
                onLayoutChange={handleMainPanelResize}
                className="flex-1"
            >
                {/* Left panel - Window Tree */}
                <ResizablePanel
                    defaultSize={settings.mainPanelSize}
                    minSize={15}
                    maxSize={50}
                >
                    <WindowTree
                        windows={windows}
                        selectedHandle={activeHandle}
                        onSelectWindow={setActiveHandle}
                        onRefresh={refresh}
                    />
                </ResizablePanel>

                <ResizableHandle />

                {/* Right panel - Window Info, Control Tree, Properties */}
                <ResizablePanel defaultSize={100 - settings.mainPanelSize} minSize={50}>
                    <div className="flex flex-col h-full">
                        <WindowInfo window={activeWindow} />

                        <ResizablePanelGroup
                            orientation={isPropertiesOnRight ? "horizontal" : "vertical"}
                            onLayoutChange={handleControlPanelResize}
                            className="flex-1"
                        >
                            {/* Control Tree */}
                            <ResizablePanel
                                defaultSize={settings.controlPanelSize}
                                minSize={20}
                            >
                                <div className="h-full overflow-auto">
                                    <Suspense fallback={<div className="p-4 text-muted-foreground">Loading controls...</div>}>
                                        <ControlTreeLoader
                                            selectedControl={selectedControl}
                                            onSelectControl={setSelectedControl}
                                            onInvoke={handleInvoke}
                                        />
                                    </Suspense>
                                </div>
                            </ResizablePanel>

                            <ResizableHandle />

                            {/* Properties Panel */}
                            <ResizablePanel
                                defaultSize={100 - settings.controlPanelSize}
                                minSize={15}
                            >
                                <PropertiesPanel control={selectedControl} />
                            </ResizablePanel>
                        </ResizablePanelGroup>
                    </div>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
}
