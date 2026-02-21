#include "ControlTree.h"
#include "Utils.h"
#include <iostream>
#include <comdef.h>

IUIAutomation* ControlTree::g_pAutomation = NULL;

// Helper to escape JSON strings (dup from WindowList, could be shared)
// Removed local EscapeJson implementation

bool ControlTree::Initialize() {
    if (g_pAutomation != NULL) return true;
    
    HRESULT hr = CoInitializeEx(NULL, COINIT_MULTITHREADED);
    if (FAILED(hr) && hr != RPC_E_CHANGED_MODE) {
        // RPC_E_CHANGED_MODE means already initialized with different mode, which is usually fine
        return false;
    }

    hr = CoCreateInstance(__uuidof(CUIAutomation), NULL,
        CLSCTX_INPROC_SERVER, __uuidof(IUIAutomation),
        (void**)&g_pAutomation);
    
    return SUCCEEDED(hr);
}

void ControlTree::Cleanup() {
    if (g_pAutomation) {
        g_pAutomation->Release();
        g_pAutomation = NULL;
    }
    CoUninitialize();
}

std::string ControlTree::GetRuntimeIdString(IUIAutomationElement* element) {
    SAFEARRAY* runtimeIdArray = NULL;
    if (FAILED(element->GetRuntimeId(&runtimeIdArray))) return "";

    std::stringstream ss;
    long lower, upper;
    SafeArrayGetLBound(runtimeIdArray, 1, &lower);
    SafeArrayGetUBound(runtimeIdArray, 1, &upper);

    int* data;
    SafeArrayAccessData(runtimeIdArray, (void**)&data);
    for (long i = lower; i <= upper; ++i) {
        if (i > lower) ss << ".";
        ss << data[i];
    }
    SafeArrayUnaccessData(runtimeIdArray);
    SafeArrayDestroy(runtimeIdArray);

    return ss.str();
}

ControlNode ControlTree::GetTreeForWindow(HWND hwnd) {
    ControlNode rootNode;
    if (!g_pAutomation) Initialize();
    if (!g_pAutomation) return rootNode;

    IUIAutomationElement* pRoot = NULL;
    if (FAILED(g_pAutomation->ElementFromHandle((UIA_HWND)hwnd, &pRoot))) {
        return rootNode;
    }

    WalkTree(pRoot, rootNode);
    
    if (pRoot) pRoot->Release();
    return rootNode;
}

void ControlTree::WalkTree(IUIAutomationElement* element, ControlNode& node) {
    BSTR bStr;
    
    if (SUCCEEDED(element->get_CurrentName(&bStr)) && bStr) {
        node.name = BstrToUtf8(bStr);
        SysFreeString(bStr);
    }
    
    if (SUCCEEDED(element->get_CurrentAutomationId(&bStr)) && bStr) {
        node.automationId = BstrToUtf8(bStr);
        SysFreeString(bStr);
    }

    if (SUCCEEDED(element->get_CurrentClassName(&bStr)) && bStr) {
        node.className = BstrToUtf8(bStr);
        SysFreeString(bStr);
    }
    
    // Control Type ID lookup could be added here for better names
    CONTROLTYPEID typeId;
    if (SUCCEEDED(element->get_CurrentControlType(&typeId))) {
        node.controlType = std::to_string(typeId); 
    }

    node.runtimeId = GetRuntimeIdString(element);

    // UIA NativeWindowHandle (often 0 for non-windowed controls).
    UIA_HWND nativeHwnd = 0;
    if (SUCCEEDED(element->get_CurrentNativeWindowHandle(&nativeHwnd))) {
        node.nativeWindowHandle = reinterpret_cast<HWND>(nativeHwnd);
    } else {
        node.nativeWindowHandle = nullptr;
    }

    // Legacy IAccessible pattern (Role/State).
    node.IsLegacyIAccessiblePatternAvailable = false;
    node.CurrentRole = 0;
    node.CurrentState = 0;
    IUIAutomationLegacyIAccessiblePattern* pLegacy = NULL;
    if (SUCCEEDED(element->GetCurrentPattern(UIA_LegacyIAccessiblePatternId, (IUnknown**)&pLegacy)) && pLegacy) {
        node.IsLegacyIAccessiblePatternAvailable = true;

        DWORD role = 0;
        if (SUCCEEDED(pLegacy->get_CurrentRole(&role))) {
            node.CurrentRole = static_cast<long>(role);
        }

        DWORD state = 0;
        if (SUCCEEDED(pLegacy->get_CurrentState(&state))) {
            node.CurrentState = static_cast<long>(state);
        }

        pLegacy->Release();
    }
    
    RECT rect;
    if (SUCCEEDED(element->get_CurrentBoundingRectangle(&rect))) {
        node.left = rect.left;
        node.top = rect.top;
        node.right = rect.right;
        node.bottom = rect.bottom;
    }

    BOOL enabled;
    if (SUCCEEDED(element->get_CurrentIsEnabled(&enabled))) {
        node.isEnabled = enabled;
    }
    
    BOOL visible;
    if (SUCCEEDED(element->get_CurrentIsOffscreen(&visible))) { // IsOffscreen means NOT visible
        node.isVisible = !visible;
    } else {
        node.isVisible = true; 
    }

    // Children
    IUIAutomationTreeWalker* pWalker = NULL;
    g_pAutomation->get_ControlViewWalker(&pWalker);
    
    if (pWalker) {
        IUIAutomationElement* pChild = NULL;
        pWalker->GetFirstChildElement(element, &pChild);
        
        while (pChild) {
            ControlNode childNode;
            WalkTree(pChild, childNode);
            node.children.push_back(childNode);

            IUIAutomationElement* pNext = NULL;
            pWalker->GetNextSiblingElement(pChild, &pNext);
            pChild->Release();
            pChild = pNext;
        }
        pWalker->Release();
    }
}

std::string ControlTree::ToJson(const ControlNode& node) {
    std::ostringstream json;
    json << "{";
    json << "\"name\":\"" << EscapeJson(node.name) << "\",";
    json << "\"controlType\":\"" << EscapeJson(node.controlType) << "\",";
    json << "\"automationId\":\"" << EscapeJson(node.automationId) << "\",";
    json << "\"className\":\"" << EscapeJson(node.className) << "\",";
    json << "\"runtimeId\":\"" << EscapeJson(node.runtimeId) << "\",";
    json << "\"nativeWindowHandle\":\"" << (node.nativeWindowHandle ? HwndToHexString(node.nativeWindowHandle) : "") << "\",";
    json << "\"IsLegacyIAccessiblePatternAvailable\":" << (node.IsLegacyIAccessiblePatternAvailable ? "true" : "false") << ",";
    json << "\"CurrentRole\":" << node.CurrentRole << ",";
    json << "\"CurrentState\":" << node.CurrentState << ",";
    json << "\"bounds\":{\"left\":" << node.left << ",\"top\":" << node.top << ",\"right\":" << node.right << ",\"bottom\":" << node.bottom << "},";
    json << "\"isEnabled\":" << (node.isEnabled ? "true" : "false") << ",";
    json << "\"isVisible\":" << (node.isVisible ? "true" : "false") << ",";
    
    json << "\"children\":[";
    for (size_t i = 0; i < node.children.size(); ++i) {
        if (i > 0) json << ",";
        json << ToJson(node.children[i]);
    }
    json << "]";
    
    json << "}";
    return json.str();
}

IUIAutomationElement* ControlTree::FindElementByRuntimeId(IUIAutomationElement* root, const std::string& runtimeId) {
    if (!root) return NULL;
    
    // Check current
    if (GetRuntimeIdString(root) == runtimeId) {
        root->AddRef();
        return root;
    }
    
    IUIAutomationTreeWalker* pWalker = NULL;
    g_pAutomation->get_ControlViewWalker(&pWalker);
    if (!pWalker) return NULL;
    
    IUIAutomationElement* pChild = NULL;
    pWalker->GetFirstChildElement(root, &pChild);
    
    IUIAutomationElement* found = NULL;
    
    while (pChild && !found) {
        found = FindElementByRuntimeId(pChild, runtimeId);
        
        IUIAutomationElement* pNext = NULL;
        pWalker->GetNextSiblingElement(pChild, &pNext);
        pChild->Release();
        pChild = pNext;
    }
    
    pWalker->Release();
    return found;
}

bool ControlTree::InvokeControl(HWND hwnd, const std::string& runtimeId) {
    if (!g_pAutomation) Initialize();
    
    IUIAutomationElement* pRoot = NULL;
    if (FAILED(g_pAutomation->ElementFromHandle((UIA_HWND)hwnd, &pRoot))) {
        return false;
    }
    
    IUIAutomationElement* target = FindElementByRuntimeId(pRoot, runtimeId);
    pRoot->Release();
    
    if (!target) return false;
    
    bool result = false;
    IUIAutomationInvokePattern* pInvoke = NULL;
    if (SUCCEEDED(target->GetCurrentPattern(UIA_InvokePatternId, (IUnknown**)&pInvoke)) && pInvoke) {
        result = SUCCEEDED(pInvoke->Invoke());
        pInvoke->Release();
    } else {
        // Try Toggle pattern
        IUIAutomationTogglePattern* pToggle = NULL;
        if (SUCCEEDED(target->GetCurrentPattern(UIA_TogglePatternId, (IUnknown**)&pToggle)) && pToggle) {
            result = SUCCEEDED(pToggle->Toggle());
            pToggle->Release();
        }
    }
    
    target->Release();
    return result;
}
