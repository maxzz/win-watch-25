import { type ComponentType, type SVGAttributes, type HTMLAttributes } from "react";
import {
    Box,
    Calendar,
    CheckSquare,
    ChevronDown,
    Type,
    Link,
    Image,
    List,
    ListOrdered,
    Menu,
    MenuSquare,
    LayoutList,
    Loader,
    Circle,
    SlidersHorizontal,
    Gauge,
    RotateCw,
    PanelTop,
    Columns,
    FileText,
    Text,
    TreeDeciduous,
    Folder,
    Boxes,
    Group,
    GripVertical,
    Table,
    Grid3X3,
    FileSpreadsheet,
    AppWindow,
    PanelLeft,
    PanelTopInactive,
    Heading,
    Minus,
    ZoomIn,
    LayoutDashboard,
    Square,
    MousePointer2,
} from "lucide-react";
import { Symbol_uia_Toolbar, Symbol_uia_Tooltip } from "@renderer/components/ui/icons/symbols/ui-automation";
import { classNames } from "@renderer/utils";

type IconComponent = ComponentType<SVGAttributes<SVGSVGElement> & HTMLAttributes<SVGSVGElement> & { size?: number | string; className?: string }>;

type IconEntry =
    | IconComponent
    | {
          component: IconComponent;
          className?: string;
          size?: number | string;
      };

/**
 * Maps UIA Control Type IDs to corresponding icon components.
 * Control Type IDs are from UIAutomationClient.h
 * https://learn.microsoft.com/en-us/windows/win32/winauto/uiauto-controltype-ids
 */
export const UIA_CONTROL_TYPE_ICONS: Record<string, IconEntry> = {
    "50000": MousePointer2, // Button
    "50001": Calendar,          // Calendar
    "50002": CheckSquare,       // CheckBox
    "50003": ChevronDown,       // ComboBox
    "50004": Type,              // Edit
    "50005": Link,              // Hyperlink
    "50006": Image,             // Image
    "50007": ListOrdered,       // ListItem
    "50008": List,              // List
    "50009": Menu,              // Menu
    "50010": MenuSquare,        // MenuBar
    "50011": LayoutList,        // MenuItem
    "50012": Loader,            // ProgressBar
    "50013": Circle,            // RadioButton
    "50014": SlidersHorizontal, // ScrollBar
    "50015": Gauge,             // Slider
    "50016": RotateCw,          // Spinner
    "50017": PanelTop,          // StatusBar
    "50018": Columns,           // Tab
    "50019": FileText,          // TabItem
    "50020": Text, // Text
    "50021": { component: Symbol_uia_Toolbar, className: "size-4" }, // ToolBar
    "50022": { component: Symbol_uia_Tooltip, className: "size-4" }, // ToolTip
    "50023": TreeDeciduous,     // Tree
    "50024": Folder,            // TreeItem
    "50025": Boxes,             // Custom
    "50026": Group,             // Group
    "50027": GripVertical,      // Thumb
    "50028": Grid3X3,           // DataGrid
    "50029": FileSpreadsheet,   // DataItem
    "50030": FileText,          // Document
    "50031": Square,            // SplitButton
    "50032": AppWindow,         // Window
    "50033": PanelLeft,         // Pane
    "50034": Heading,           // Header
    "50035": PanelTopInactive,  // HeaderItem
    "50036": Table,             // Table
    "50037": PanelTop,          // TitleBar
    "50038": Minus,             // Separator
    "50039": ZoomIn,            // SemanticZoom
    "50040": LayoutDashboard,   // AppBar
};

/**
 * Default icon for unknown control types
 */
export const DefaultControlTypeIcon: IconComponent = Box;

/**
 * Get the icon component for a given control type ID
 * @param controlTypeId - The numeric control type ID as string (e.g., "50000")
 * @returns The icon component for the control type, or the default icon if unknown
 */
export function getControlTypeIcon(controlTypeId: string): IconComponent {
    const entry = UIA_CONTROL_TYPE_ICONS[controlTypeId];

    if (!entry) return DefaultControlTypeIcon;

    let Comp: IconComponent;
    let defaultClass: string | undefined;
    let defaultSize: number | string | undefined;

    if (typeof entry === "function") {
        Comp = entry as IconComponent;
    } else {
        Comp = entry.component;
        defaultClass = entry.className;
        defaultSize = entry.size;
    }

    const Wrapper: IconComponent = ({ className, size, ...rest }) => {
        const mergedClass = classNames(defaultClass ?? "", className ?? "") || undefined;
        const appliedSize = size ?? defaultSize;
        return <Comp className={mergedClass} size={appliedSize} {...(rest as any)} />;
    };

    return Wrapper;
}
