#pragma once
#include <windows.h>
#include <uiautomation.h>
#include <string>

class ControlInfo {
public:
    static std::string GetDetailsJson(IUIAutomationElement* element);
};
