#ifndef WINDOWMONITOR_EXPORTS
#define WINDOWMONITOR_EXPORTS
#endif
#include "WindowMonitor.h"
#include "WindowList.h"
#include "ControlTree.h"
#include "ControlHighlighter.h"
#include "Utils.h"
#include <mutex>
#include <sstream>
#include <cstdlib>

static ActiveWindowChangedCallback g_Callback = nullptr;
static HWINEVENTHOOK g_hForegroundHook = nullptr;
static HWINEVENTHOOK g_hLifecycleHook = nullptr;
static HWINEVENTHOOK g_hMinimizeHook = nullptr;
static std::mutex g_Mutex;
static HWND g_LastEmittedHwnd = nullptr;

static void EmitActiveWindowChangedLocked(HWND hwnd) {
    if (!g_Callback) {
        return;
    }
    if (!hwnd || !IsWindow(hwnd)) {
        return;
    }
    if (g_LastEmittedHwnd == hwnd) {
        return;
    }
    g_LastEmittedHwnd = hwnd;
    // Handle format is always canonical fixed-width hex (0x...),
    // same formatter as WindowList and ControlTree.
    std::string json = "{\"handle\":\"" + HwndToHexString(hwnd) + "\"}";
    g_Callback(json.c_str());
}

void CALLBACK WinEventProc(HWINEVENTHOOK hWinEventHook, DWORD event, HWND hwnd, LONG idObject, LONG idChild, DWORD dwEventThread, DWORD dwmsEventTime) {
    UNREFERENCED_PARAMETER(hWinEventHook);
    UNREFERENCED_PARAMETER(dwEventThread);
    UNREFERENCED_PARAMETER(dwmsEventTime);
    if (idObject != OBJID_WINDOW || idChild != CHILDID_SELF) {
        return;
    }

    std::lock_guard<std::mutex> lock(g_Mutex);

    if (event == EVENT_SYSTEM_FOREGROUND) {
        EmitActiveWindowChangedLocked(hwnd);
        return;
    }

    if (event == EVENT_OBJECT_DESTROY || event == EVENT_SYSTEM_MINIMIZESTART) {
        // Foreground close/minimize transitions are not always delivered as
        // EVENT_SYSTEM_FOREGROUND. Re-sample current foreground explicitly.
        HWND foreground = GetForegroundWindow();
        EmitActiveWindowChangedLocked(foreground);
    }
}

extern "C" {

WM_API bool InitializeMonitor() {
    bool result = ControlTree::Initialize();
    if (result) {
        ControlHighlighter::GetInstance().Initialize();
    }
    return result;
}

WM_API void CleanupMonitor() {
    StopActiveWindowMonitoring();
    ControlHighlighter::GetInstance().Cleanup();
    ControlTree::Cleanup();
}

WM_API void StartActiveWindowMonitoring(ActiveWindowChangedCallback callback) {
    std::lock_guard<std::mutex> lock(g_Mutex);
    g_Callback = callback;
    g_LastEmittedHwnd = nullptr;
    if (!g_hForegroundHook) {
        // Run hook on a separate thread? 
        // SetWinEventHook requires a message loop if we want to catch events from all processes.
        // Actually, for EVENT_SYSTEM_FOREGROUND out of context (WINEVENT_OUTOFCONTEXT), 
        // the callback is called on the thread that called SetWinEventHook. 
        // So that thread must have a message loop.
        // Node.js main thread has a message loop (libuv), but typically we might want a dedicated thread for this to not block or depend on Node's loop details.
        // However, standard SetWinEventHook WINEVENT_OUTOFCONTEXT works fine if the message loop is pumping.
        // In an Electron/Node addon, we might be on a worker thread or the main thread.
        
        // For simplicity, we assume the caller pumps messages or we might need a worker thread with a message loop.
        // But for now, let's try standard hook.
        
        g_hForegroundHook = SetWinEventHook(EVENT_SYSTEM_FOREGROUND, EVENT_SYSTEM_FOREGROUND, NULL, WinEventProc, 0, 0, WINEVENT_OUTOFCONTEXT | WINEVENT_SKIPOWNPROCESS);
    }
    if (!g_hLifecycleHook) {
        g_hLifecycleHook = SetWinEventHook(EVENT_OBJECT_DESTROY, EVENT_OBJECT_DESTROY, NULL, WinEventProc, 0, 0, WINEVENT_OUTOFCONTEXT | WINEVENT_SKIPOWNPROCESS);
    }
    if (!g_hMinimizeHook) {
        g_hMinimizeHook = SetWinEventHook(EVENT_SYSTEM_MINIMIZESTART, EVENT_SYSTEM_MINIMIZESTART, NULL, WinEventProc, 0, 0, WINEVENT_OUTOFCONTEXT | WINEVENT_SKIPOWNPROCESS);
    }

    // Emit current foreground once when monitoring starts, so renderer can sync immediately.
    EmitActiveWindowChangedLocked(GetForegroundWindow());
}

WM_API void StopActiveWindowMonitoring() {
    std::lock_guard<std::mutex> lock(g_Mutex);
    g_Callback = nullptr;
    g_LastEmittedHwnd = nullptr;
    if (g_hForegroundHook) {
        UnhookWinEvent(g_hForegroundHook);
        g_hForegroundHook = nullptr;
    }
    if (g_hLifecycleHook) {
        UnhookWinEvent(g_hLifecycleHook);
        g_hLifecycleHook = nullptr;
    }
    if (g_hMinimizeHook) {
        UnhookWinEvent(g_hMinimizeHook);
        g_hMinimizeHook = nullptr;
    }
}

WM_API const char* GetTopLevelWindowsJson() {
    auto windows = WindowList::EnumerateTopLevelWindows();
    std::string json = WindowList::ToJson(windows);
    return _strdup(json.c_str());
}

WM_API const char* GetTopLevelWindowsJsonEx(DWORD excludeProcessId) {
    auto windows = WindowList::EnumerateTopLevelWindows(excludeProcessId);
    std::string json = WindowList::ToJson(windows);
    return _strdup(json.c_str());
}

WM_API const char* GetControlTreeJson(HWND hwnd) {
    auto root = ControlTree::GetTreeForWindow(hwnd);
    std::string json = ControlTree::ToJson(root);
    return _strdup(json.c_str());
}

WM_API const char* GetControlDetailsJson(HWND hwnd, const char* runtimeId) {
    // TODO: find element by runtimeId and call ControlInfo::GetDetailsJson
    // For now returning empty
    UNREFERENCED_PARAMETER(hwnd);
    UNREFERENCED_PARAMETER(runtimeId);
    return _strdup("{}");
}

WM_API void HighlightRect(int left, int top, int right, int bottom, int color, int borderWidth, int blinkCount) {
    HighlightParams params;
    params.left = left;
    params.top = top;
    params.right = right;
    params.bottom = bottom;
    
    // Color is passed as 0xRRGGBB (RGB). Windows COLORREF is 0x00BBGGRR (BGR),
    // so convert before using it with GDI APIs.
    if (color != 0) {
        const int r = (color >> 16) & 0xFF;
        const int g = (color >> 8) & 0xFF;
        const int b = color & 0xFF;
        params.highlightColor = RGB(r, g, b);
    }
    
    if (borderWidth > 0) {
        params.borderWidth = borderWidth;
    }
    
    if (blinkCount >= 0) {
        params.blinkCount = blinkCount;
    }
    
    ControlHighlighter::GetInstance().Highlight(params);
}

WM_API void HideHighlight() {
    ControlHighlighter::GetInstance().Hide();
}

WM_API const char* GetWindowRectJson(HWND hwnd) {
    if (!IsWindow(hwnd)) {
        return _strdup("null");
    }
    
    RECT rect;
    if (!GetWindowRect(hwnd, &rect)) {
        return _strdup("null");
    }
    
    std::ostringstream json;
    json << "{";
    json << "\"left\":" << rect.left << ",";
    json << "\"top\":" << rect.top << ",";
    json << "\"right\":" << rect.right << ",";
    json << "\"bottom\":" << rect.bottom;
    json << "}";
    
    return _strdup(json.str().c_str());
}

WM_API const char* GetControlCurrentBoundsJson(HWND hwnd, const char* runtimeId) {
    if (!IsWindow(hwnd) || !runtimeId || runtimeId[0] == '\0') {
        return _strdup("null");
    }

    RECT rect;
    if (!ControlTree::TryGetControlCurrentBounds(hwnd, runtimeId, rect)) {
        return _strdup("null");
    }

    std::ostringstream json;
    json << "{";
    json << "\"left\":" << rect.left << ",";
    json << "\"top\":" << rect.top << ",";
    json << "\"right\":" << rect.right << ",";
    json << "\"bottom\":" << rect.bottom;
    json << "}";

    return _strdup(json.str().c_str());
}

WM_API bool IsWindowHandleValid(HWND hwnd) {
    return IsWindow(hwnd) != FALSE;
}

WM_API bool InvokeControl(HWND hwnd, const char* runtimeId) {
    return ControlTree::InvokeControl(hwnd, runtimeId);
}

WM_API void FreeString(const char* str) {
    if (str) free((void*)str);
}

} // extern "C"
