#include "WindowList.h"
#include "Utils.h"
#include <psapi.h>
#include <algorithm>

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

    // Filter out empty titles or common invisible system windows if desired
    // For now, keep most
    if (!info.title.empty()) {
        pWindows->push_back(info);
    }

    return TRUE;
}

std::string WindowList::GetWindowTitle(HWND hwnd) {
    int len = GetWindowTextLengthA(hwnd);
    if (len == 0) return "";
    std::vector<char> buf(len + 1);
    GetWindowTextA(hwnd, buf.data(), len + 1);
    return std::string(buf.data());
}

std::string WindowList::GetWindowProcessName(HWND hwnd) {
    DWORD pid;
    GetWindowThreadProcessId(hwnd, &pid);
    HANDLE hProcess = OpenProcess(PROCESS_QUERY_INFORMATION | PROCESS_VM_READ, FALSE, pid);
    if (hProcess) {
        char buf[MAX_PATH];
        if (GetModuleBaseNameA(hProcess, NULL, buf, MAX_PATH)) {
            CloseHandle(hProcess);
            return std::string(buf);
        }
        CloseHandle(hProcess);
    }
    return "";
}

std::string WindowList::GetWindowClassNameStr(HWND hwnd) {
    char buf[256];
    GetClassNameA(hwnd, buf, 256);
    return std::string(buf);
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
        json << "\"processId\":" << w.processId;
        // children logic can be added here if we were enumerating child windows
        json << "}";
    }
    json << "]";
    return json.str();
}
