export type NativeBounds = {
    left: number;
    top: number;
    right: number;
    bottom: number;
};

export interface WindowInfo {       // Top level window info (obtained from C++ native code by calling WindowList::EnumerateTopLevelWindows)
    handle: string;                 // from EnumWindowsProc
    title: string;                  // from GetWindowTitle
    processName: string;            // from GetWindowProcessName
    processId: number;              // from GetWindowThreadProcessId
    className: string;              // from GetWindowClassNameStr
    rect: NativeBounds;             // from GetWindowRect
    children?: WindowInfo[];        // from EnumWindowsProc
}

export interface ControlNode {      // Control node info (obtained from C++ native code by calling ControlTree::GetTreeForWindow)
    name: string;                   // from IUIAutomationElement::GetCurrentName
    controlType: string;            // from IUIAutomationElement::GetCurrentControlType
    automationId: string;           // from IUIAutomationElement::GetCurrentAutomationId
    className: string;              // from IUIAutomationElement::GetClassName
    runtimeId: string;              // from IUIAutomationElement::GetRuntimeId
    nativeWindowHandle: string;     // from IUIAutomationElement::get_CurrentNativeWindowHandle
    bounds: NativeBounds;           // from IUIAutomationElement::GetCurrentBoundingRectangle
    isEnabled: boolean;             // from IUIAutomationElement::GetCurrentIsEnabled
    isVisible: boolean;             // from IUIAutomationElement::GetCurrentIsOffscreen
    children?: ControlNode[];
}
