#pragma once
#include <windows.h>
#include <vector>
#include <string>

struct WindowInfo {
    HWND handle;
    std::string title;
    std::string processName;
    DWORD processId;
    std::string className;
    RECT rect;  // Window rectangle in screen coordinates
    std::vector<WindowInfo> children;
};

class WindowList {
public:
    static std::vector<WindowInfo> EnumerateTopLevelWindows();
    static std::string ToJson(const std::vector<WindowInfo>& windows);
    
private:
    static BOOL CALLBACK EnumWindowsProc(HWND hwnd, LPARAM lParam);
    static std::string GetWindowTitle(HWND hwnd);
    static std::string GetWindowProcessName(HWND hwnd);
    static std::string GetWindowClassNameStr(HWND hwnd);
};
