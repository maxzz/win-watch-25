import React, { useState, useEffect } from 'react';
import { WindowTree } from './components/WindowTree';
import { ControlTree } from './components/ControlTree';
import { PropertiesPanel } from './components/PropertiesPanel';
import { WindowInfo } from './components/WindowInfo';
import { useWindowList } from './hooks/useWindowList';
import { useActiveWindow } from './hooks/useActiveWindow';
import { ControlNode } from './types';

function App() {
  const { windows, refresh } = useWindowList();
  const { activeHandle, setActiveHandle, controlTree } = useActiveWindow(null);
  const [selectedControl, setSelectedControl] = useState<ControlNode | null>(null);

  // Find window info for active handle
  // This might be slow if list is huge, but fine for now
  // Also handle format mismatch (hex vs dec) might be an issue
  // I'll try to fuzzy match or normalized in the future
  const activeWindow = windows.find(w => w.handle == activeHandle) || 
                       windows.find(w => parseInt(w.handle) == parseInt(activeHandle || "0")) || null;

  useEffect(() => {
    // Start monitoring on mount
    window.api.startMonitoring("0"); // Argument ignored by current C++ impl
    return () => {
      window.api.stopMonitoring();
    };
  }, []);

  const handleInvoke = async (control: ControlNode) => {
    if (activeHandle && control.runtimeId) {
        console.log("Invoking", control.name);
        await window.api.invokeControl(activeHandle, control.runtimeId);
    }
  };

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

export default App;
