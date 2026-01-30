#ifndef WINDOWMONITOR_EXPORTS
#define WINDOWMONITOR_EXPORTS
#endif
#include "WindowMonitor.h"
#include "WindowList.h"
#include "ControlTree.h"
#include "ControlHighlighter.h"
#include <mutex>
#include <sstream>
#include <cstdint>
#include <cstdlib>

static ActiveWindowChangedCallback g_Callback = nullptr;
static HWINEVENTHOOK g_hHook = nullptr;
static std::mutex g_Mutex;

void CALLBACK WinEventProc(HWINEVENTHOOK hWinEventHook, DWORD event, HWND hwnd, LONG idObject, LONG idChild, DWORD dwEventThread, DWORD dwmsEventTime) {
    UNREFERENCED_PARAMETER(hWinEventHook);
    UNREFERENCED_PARAMETER(dwEventThread);
    UNREFERENCED_PARAMETER(dwmsEventTime);
    if (event == EVENT_SYSTEM_FOREGROUND && idObject == OBJID_WINDOW && idChild == CHILDID_SELF) {
        std::lock_guard<std::mutex> lock(g_Mutex);
        if (g_Callback) {
            // We just send a simple JSON with the handle for now
            // The frontend can then request the full tree
            // HWND is a pointer type; serialize it via an integer type wide enough for pointers.
            const auto handleValue = static_cast<std::uint64_t>(reinterpret_cast<std::uintptr_t>(hwnd));
            std::string json = "{\"handle\":\"" + std::to_string(handleValue) + "\"}";
            // Or better, reuse WindowList logic to get quick info
            g_Callback(json.c_str());
        }
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
    if (!g_hHook) {
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
        
        g_hHook = SetWinEventHook(EVENT_SYSTEM_FOREGROUND, EVENT_SYSTEM_FOREGROUND, NULL, WinEventProc, 0, 0, WINEVENT_OUTOFCONTEXT | WINEVENT_SKIPOWNPROCESS);
    }
}

WM_API void StopActiveWindowMonitoring() {
    std::lock_guard<std::mutex> lock(g_Mutex);
    g_Callback = nullptr;
    if (g_hHook) {
        UnhookWinEvent(g_hHook);
        g_hHook = nullptr;
    }
}

WM_API const char* GetTopLevelWindowsJson() {
    auto windows = WindowList::EnumerateTopLevelWindows();
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

WM_API void HighlightRect(int x, int y, int width, int height, int color, int borderWidth, int blinkCount) {
    HighlightParams params;
    params.x = x;
    params.y = y;
    params.width = width;
    params.height = height;
    
    // Color is passed as RGB, convert if needed (Windows uses BGR internally but we use RGB for API consistency)
    if (color != 0) {
        params.highlightColor = color;
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

WM_API bool InvokeControl(HWND hwnd, const char* runtimeId) {
    return ControlTree::InvokeControl(hwnd, runtimeId);
}

WM_API void FreeString(const char* str) {
    if (str) free((void*)str);
}

} // extern "C"
