#pragma once
#include <windows.h>
#include <string>
#include <functional>

// Export macro
#ifdef WINDOWMONITOR_EXPORTS
#define WM_API __declspec(dllexport)
#else
#define WM_API __declspec(dllimport)
#endif

// Callback type for active window changes
typedef void (*ActiveWindowChangedCallback)(const char* windowInfoJson);

extern "C" {
    // Initialize the monitor
    WM_API bool InitializeMonitor();
    
    // Cleanup resources
    WM_API void CleanupMonitor();

    // Start monitoring active window changes
    WM_API void StartActiveWindowMonitoring(ActiveWindowChangedCallback callback);

    // Stop monitoring
    WM_API void StopActiveWindowMonitoring();

    // Get list of all top-level windows as JSON string
    WM_API const char* GetTopLevelWindowsJson();

    // Get control tree for a specific window handle as JSON string
    WM_API const char* GetControlTreeJson(HWND hwnd);

    // Get detailed info for a specific control (by runtime ID or other identifier)
    // Note: This might need more complex identification strategy
    WM_API const char* GetControlDetailsJson(HWND hwnd, const char* runtimeId);
    
    // Highlight a rectangle on screen
    // Parameters: left, top, right, bottom - screen coordinates of the rectangle
    //             color - RGB color (default: red = 0x0000FF in BGR format)
    //             borderWidth - width of the border in pixels (default: 5)
    //             blinkCount - number of blinks (0 = stay visible until hidden, default: 5)
    WM_API void HighlightRect(int left, int top, int right, int bottom, int color, int borderWidth, int blinkCount);
    
    // Hide the highlight rectangle
    WM_API void HideHighlight();

    // Get current window rectangle in screen coordinates
    // Returns JSON: {"left": number, "top": number, "right": number, "bottom": number} or null if window not found
    WM_API const char* GetWindowRectJson(HWND hwnd);

    // Invoke a control (e.g. click)
    WM_API bool InvokeControl(HWND hwnd, const char* runtimeId);
    
    // Free string memory allocated by the DLL
    WM_API void FreeString(const char* str);
}
