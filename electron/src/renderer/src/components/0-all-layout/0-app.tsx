import { useState, useEffect } from 'react';
import { useActiveWindow } from '@renderer/hooks/useActiveWindow';
import { useWindowList } from '@renderer/hooks/useWindowList';
import { ControlNode } from '@renderer/types';

import { ControlTree } from '../2-main/2-control-tree';
import { PropertiesPanel } from '../2-main/3-properties-panel';
import { WindowInfo } from '../2-main/4-window-info';
import { WindowTree } from '../2-main/1-window-tree';

export function App() {
    const { windows, refresh } = useWindowList();
    const { activeHandle, setActiveHandle, controlTree } = useActiveWindow(null);
    const [selectedControl, setSelectedControl] = useState<ControlNode | null>(null);

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

    return (
        <div className="flex h-screen w-screen overflow-hidden text-foreground bg-background">
            <div className="w-1/4 min-w-[250px] border-r">
                <WindowTree
                    windows={windows}
                    selectedHandle={activeHandle}
                    onSelectWindow={setActiveHandle}
                    onRefresh={refresh}
                />
            </div>

            <div className="flex-1 flex flex-col min-w-0">
                <WindowInfo window={activeWindow} />

                <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex-1 overflow-auto border-b">
                        <ControlTree
                            root={controlTree}
                            selectedControl={selectedControl}
                            onSelectControl={setSelectedControl}
                            onInvoke={handleInvoke}
                        />
                    </div>

                    <div className="h-1/3 min-h-[150px]">
                        <PropertiesPanel control={selectedControl} />
                    </div>
                </div>
            </div>
        </div>
    );
}
