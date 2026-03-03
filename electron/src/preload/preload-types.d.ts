type PointXY = {            // Point with 2 numbers, it can be client or screen coordinates
    x: number;
    y: number;
};

type Rect4 = {              // Rectangle with 4 numbers, it can be client or screen coordinates
    left: number;
    right: number;
    top: number;
    bottom: number;
};

// Types for highlight API

interface HighlightBounds {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface HighlightOptions {
    color?: number;       // RGB color (e.g., 0xFF0000 for red)
    borderWidth?: number; // Border width in pixels (default: 5)
    blinkCount?: number;  // Number of blinks (0 = stay visible, default: 5)
}

// API exposed by preload script

interface WinWatchApi {
    getTopLevelWindows: (options?: { excludeOwnAppWindows?: boolean; }) => Promise<string>; // The returned data is stringified WindowInfo[]
    getControlTree: (handle: string) => Promise<string>;                             // The handle is a window handle like "0x000000001234ABCD"
    startMonitoring: (handle: string) => Promise<boolean>;                           // The handle is ignored, it is only for compatibility with the old API
    stopMonitoring: () => Promise<boolean>;                                          // Stops the monitoring of the active window
    invokeControl: (handle: string, runtimeId: string) => Promise<boolean>;          // Invokes the action of a control by runtime ID (e.g. click)
    onActiveWindowChanged: (callback: (data: string) => void) => () => void;         // The format of the data is the same as the one returned by getTopLevelWindows: stringified WindowInfo.
    highlightRect: (bounds: Rect4, options?: HighlightOptions) => Promise<void>;     // Highlights a rectangle on screen
    hideHighlight: () => Promise<void>;                                              // Hides the highlight rectangle
    getWindowRect: (handle: string) => Promise<string>;                              // Gets the rectangle of a window in screen coordinates
    getControlCurrentBounds: (handle: string, runtimeId: string) => Promise<string>; // Gets the current bounds of a control by runtime ID
    isWindowHandleValid: (handle: string) => Promise<boolean>;                       // Checks if a window handle is valid
    quitApp: () => Promise<void>;                                                    // Quits the application
}

declare var tmApi: WinWatchApi;
