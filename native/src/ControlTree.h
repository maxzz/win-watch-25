#pragma once
#include <windows.h>
#include <uiautomation.h>
#include <string>
#include <vector>

struct ControlNode {
    std::string name;
    std::string controlType;
    std::string automationId;
    std::string className;
    std::string runtimeId;
    HWND nativeWindowHandle = nullptr;
    bool IsLegacyIAccessiblePatternAvailable = false;
    long CurrentRole = 0;
    long CurrentState = 0;
    long left, top, right, bottom;
    bool isEnabled;
    bool isVisible;
    std::vector<ControlNode> children;
};

class ControlTree {
public:
    static bool Initialize();
    static void Cleanup();
    static ControlNode GetTreeForWindow(HWND hwnd);
    static std::string ToJson(const ControlNode& node);
    static bool InvokeControl(HWND hwnd, const std::string& runtimeId);

private:
    static IUIAutomation* g_pAutomation;
    static void WalkTree(IUIAutomationElement* element, ControlNode& node);
    static std::string GetRuntimeIdString(IUIAutomationElement* element);
    static IUIAutomationElement* FindElementByRuntimeId(IUIAutomationElement* root, const std::string& runtimeId);
};
