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
    getTopLevelWindows: () => Promise<string>;
    getControlTree: (handle: string) => Promise<string>;
    startMonitoring: (handle: string) => Promise<boolean>;
    stopMonitoring: () => Promise<boolean>;
    invokeControl: (handle: string, runtimeId: string) => Promise<boolean>;
    onActiveWindowChanged: (callback: (data: string) => void) => () => void;
    highlightRect: (bounds: HighlightBounds, options?: HighlightOptions) => Promise<void>;
    hideHighlight: () => Promise<void>;
}

declare var tmApi: WinWatchApi;
