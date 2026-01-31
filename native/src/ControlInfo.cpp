#include "ControlInfo.h"
#include "Utils.h"
#include <comdef.h>

std::string ControlInfo::GetDetailsJson(IUIAutomationElement* element) {
    std::ostringstream json;
    json << "{";
    
    BSTR bStr;
    if (SUCCEEDED(element->get_CurrentName(&bStr)) && bStr) {
        json << "\"name\":\"" << EscapeJson(BstrToUtf8(bStr)) << "\",";
        SysFreeString(bStr);
    }
    
    if (SUCCEEDED(element->get_CurrentAutomationId(&bStr)) && bStr) {
        json << "\"automationId\":\"" << EscapeJson(BstrToUtf8(bStr)) << "\",";
        SysFreeString(bStr);
    }
    
    // Add more properties here (patterns, help text, etc.)
    
    json << "\"hasDetails\":true";
    json << "}";
    return json.str();
}
