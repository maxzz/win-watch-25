/// <reference types="vite/client" />

interface Window {
  api: {
    getTopLevelWindows: () => Promise<string>;
    getControlTree: (handle: string) => Promise<string>;
    startMonitoring: (handle: string) => Promise<boolean>;
    stopMonitoring: () => Promise<boolean>;
    invokeControl: (handle: string, runtimeId: string) => Promise<boolean>;
    onActiveWindowChanged: (callback: (data: string) => void) => () => void;
  }
}
