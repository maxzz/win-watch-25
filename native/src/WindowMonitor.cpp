#include "WindowMonitor.h"
#include "WindowList.h"
#include "ControlTree.h"
#include "ControlInfo.h"
#include "ControlHighlighter.h"
#include <atomic>
#include <thread>
#include <mutex>
#include <sstream>

static ActiveWindowChangedCallback g_Callback = nullptr;
static HWINEVENTHOOK g_hHook = nullptr;
static std::mutex g_Mutex;

void CALLBACK WinEventProc(HWINEVENTHOOK hWinEventHook, DWORD event, HWND hwnd, LONG idObject, LONG idChild, DWORD dwEventThread, DWORD dwmsEventTime) {
    if (event == EVENT_SYSTEM_FOREGROUND && idObject == OBJID_WINDOW && idChild == CHILDID_SELF) {
        std::lock_guard<std::mutex> lock(g_Mutex);
        if (g_Callback) {
            // We just send a simple JSON with the handle for now
            // The frontend can then request the full tree
            std::string json = "{\"handle\":\"" + std::to_string((long long)hwnd) + "\"}"; // Simplified handle
            // Or better, reuse WindowList logic to get quick info
            g_Callback(json.c_str());
        }
    }
}

bool InitializeMonitor() {
    bool result = ControlTree::Initialize();
    if (result) {
        ControlHighlighter::GetInstance().Initialize();
    }
    return result;
}

void CleanupMonitor() {
    StopActiveWindowMonitoring();
    ControlHighlighter::GetInstance().Cleanup();
    ControlTree::Cleanup();
}

void StartActiveWindowMonitoring(ActiveWindowChangedCallback callback) {
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

void StopActiveWindowMonitoring() {
    std::lock_guard<std::mutex> lock(g_Mutex);
    g_Callback = nullptr;
    if (g_hHook) {
        UnhookWinEvent(g_hHook);
        g_hHook = nullptr;
    }
}

const char* GetTopLevelWindowsJson() {
    auto windows = WindowList::EnumerateTopLevelWindows();
    std::string json = WindowList::ToJson(windows);
    return _strdup(json.c_str());
}

const char* GetControlTreeJson(HWND hwnd) {
    auto root = ControlTree::GetTreeForWindow(hwnd);
    std::string json = ControlTree::ToJson(root);
    return _strdup(json.c_str());
}

const char* GetControlDetailsJson(HWND hwnd, const char* runtimeId) {
    // TODO: find element by runtimeId and call ControlInfo::GetDetailsJson
    // For now returning empty
    return _strdup("{}");
}

void HighlightRect(int x, int y, int width, int height, int color, int borderWidth, int blinkCount) {
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

void HideHighlight() {
    ControlHighlighter::GetInstance().Hide();
}

const char* GetWindowRectJson(HWND hwnd) {
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

bool InvokeControl(HWND hwnd, const char* runtimeId) {
    return ControlTree::InvokeControl(hwnd, runtimeId);
}

void FreeString(const char* str) {
    if (str) free((void*)str);
}
