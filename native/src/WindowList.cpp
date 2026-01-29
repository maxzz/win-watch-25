#include "WindowList.h"
#include "Utils.h"
#include <psapi.h>

std::vector<WindowInfo> WindowList::EnumerateTopLevelWindows() {
    std::vector<WindowInfo> windows;
    EnumWindows(EnumWindowsProc, (LPARAM)&windows);
    return windows;
}

BOOL CALLBACK WindowList::EnumWindowsProc(HWND hwnd, LPARAM lParam) {
    if (!IsWindowVisible(hwnd)) return TRUE;

    std::vector<WindowInfo>* pWindows = (std::vector<WindowInfo>*)lParam;
    
    WindowInfo info;
    info.handle = hwnd;
    info.title = GetWindowTitle(hwnd);
    info.processName = GetWindowProcessName(hwnd);
    info.className = GetWindowClassNameStr(hwnd);
    GetWindowThreadProcessId(hwnd, &info.processId);
    GetWindowRect(hwnd, &info.rect);  // Get window rectangle in screen coordinates

    // Filter out empty titles or common invisible system windows if desired
    // For now, keep most
    if (!info.title.empty()) {
        pWindows->push_back(info);
    }

    return TRUE;
}

std::string WindowList::GetWindowTitle(HWND hwnd) {
    int len = GetWindowTextLengthW(hwnd);
    if (len == 0) return "";

    std::wstring buf(static_cast<size_t>(len + 1), L'\0');
    int copied = GetWindowTextW(hwnd, &buf[0], len + 1);
    if (copied <= 0) return "";
    buf.resize(static_cast<size_t>(copied));
    return WideToUtf8(buf);
}

std::string WindowList::GetWindowProcessName(HWND hwnd) {
    DWORD pid;
    GetWindowThreadProcessId(hwnd, &pid);
    HANDLE hProcess = OpenProcess(PROCESS_QUERY_INFORMATION | PROCESS_VM_READ, FALSE, pid);
    if (hProcess) {
        wchar_t buf[MAX_PATH];
        DWORD copied = GetModuleBaseNameW(hProcess, NULL, buf, MAX_PATH);
        if (copied > 0) {
            CloseHandle(hProcess);
            return WideToUtf8(std::wstring(buf, buf + copied));
        }
        CloseHandle(hProcess);
    }
    return "";
}

std::string WindowList::GetWindowClassNameStr(HWND hwnd) {
    wchar_t buf[256];
    int copied = GetClassNameW(hwnd, buf, 256);
    if (copied <= 0) return "";
    return WideToUtf8(std::wstring(buf, buf + copied));
}

std::string WindowList::ToJson(const std::vector<WindowInfo>& windows) {
    std::ostringstream json;
    json << "[";
    for (size_t i = 0; i < windows.size(); ++i) {
        if (i > 0) json << ",";
        const auto& w = windows[i];
        json << "{";
        json << "\"handle\":\"" << (void*)w.handle << "\","; // Format pointer as hex string usually
        json << "\"title\":\"" << EscapeJson(w.title) << "\",";
        json << "\"processName\":\"" << EscapeJson(w.processName) << "\",";
        json << "\"className\":\"" << EscapeJson(w.className) << "\",";
        json << "\"processId\":" << w.processId << ",";
        json << "\"rect\":{";
        json << "\"left\":" << w.rect.left << ",";
        json << "\"top\":" << w.rect.top << ",";
        json << "\"right\":" << w.rect.right << ",";
        json << "\"bottom\":" << w.rect.bottom;
        json << "}";
        // children logic can be added here if we were enumerating child windows
        json << "}";
    }
    json << "]";
    return json.str();
}
