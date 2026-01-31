import type { JSX } from "react";
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
import { UIA_CONTROL_TYPE_FILMSTRIP_ICONS, DefaultFilmstripControlTypeIcon } from "./2-uia-control-type-filmstrip-icons";

const USE_FILMSTRIP = false; // Set to true to use the new pixel-art filmstrip icons

const iconClass = "size-3";

/**
 * Maps UIA Control Type IDs to corresponding Lucide icon elements.
 */
const UIA_LUCIDE_ICONS: Record<string, JSX.Element> = {
    "50000": <MousePointer2 className={iconClass} />,     // Button
    "50001": <Calendar className={iconClass} />,          // Calendar
    "50002": <CheckSquare className={iconClass} />,       // CheckBox
    "50003": <ChevronDown className={iconClass} />,       // ComboBox
    "50004": <Type className={iconClass} />,              // Edit
    "50005": <Link className={iconClass} />,              // Hyperlink
    "50006": <Image className={iconClass} />,             // Image
    "50007": <ListOrdered className={iconClass} />,       // ListItem
    "50008": <List className={iconClass} />,              // List
    "50009": <Menu className={iconClass} />,              // Menu
    "50010": <MenuSquare className={iconClass} />,        // MenuBar
    "50011": <LayoutList className={iconClass} />,        // MenuItem
    "50012": <Loader className={iconClass} />,            // ProgressBar
    "50013": <Circle className={iconClass} />,            // RadioButton
    "50014": <SlidersHorizontal className={iconClass} />, // ScrollBar
    "50015": <Gauge className={iconClass} />,             // Slider
    "50016": <RotateCw className={iconClass} />,          // Spinner
    "50017": <PanelTop className={iconClass} />,          // StatusBar
    "50018": <Columns className={iconClass} />,           // Tab
    "50019": <FileText className={iconClass} />,          // TabItem
    "50020": <Text className={iconClass} />,              // Text
    "50021": <Symbol_uia_Toolbar className={iconClass} />,// ToolBar
    "50022": <Symbol_uia_Tooltip className={iconClass} />,// ToolTip
    "50023": <TreeDeciduous className={iconClass} />,     // Tree
    "50024": <Folder className={iconClass} />,            // TreeItem
    "50025": <Boxes className={iconClass} />,             // Custom
    "50026": <Group className={iconClass} />,             // Group
    "50027": <GripVertical className={iconClass} />,      // Thumb
    "50028": <Grid3X3 className={iconClass} />,           // DataGrid
    "50029": <FileSpreadsheet className={iconClass} />,   // DataItem
    "50030": <FileText className={iconClass} />,          // Document
    "50031": <Square className={iconClass} />,            // SplitButton
    "50032": <AppWindow className={iconClass} />,         // Window
    "50033": <PanelLeft className={iconClass} />,         // Pane
    "50034": <Heading className={iconClass} />,           // Header
    "50035": <PanelTopInactive className={iconClass} />,  // HeaderItem
    "50036": <Table className={iconClass} />,             // Table
    "50037": <PanelTop className={iconClass} />,          // TitleBar
    "50038": <Minus className={iconClass} />,             // Separator
    "50039": <ZoomIn className={iconClass} />,            // SemanticZoom
    "50040": <LayoutDashboard className={iconClass} />,   // AppBar
};

const DefaultLucideIcon: JSX.Element = <Box className={iconClass} />;

/**
 * Maps UIA Control Type IDs to corresponding icon elements.
 * Control Type IDs are from UIAutomationClient.h
 * https://learn.microsoft.com/en-us/windows/win32/winauto/uiauto-controltype-ids
 */
export const UIA_CONTROL_TYPE_ICONS: Record<string, JSX.Element> = USE_FILMSTRIP
    ? UIA_CONTROL_TYPE_FILMSTRIP_ICONS
    : UIA_LUCIDE_ICONS;

/**
 * Default icon for unknown control types
 */
export const DefaultControlTypeIcon: JSX.Element = USE_FILMSTRIP
    ? DefaultFilmstripControlTypeIcon
    : DefaultLucideIcon;

/**
 * Get the icon element for a given control type ID
 * @param controlTypeId - The numeric control type ID as string (e.g., "50000")
 * @returns The icon element for the control type, or the default icon if unknown
 */
export function getControlTypeIcon(controlTypeId: string): JSX.Element {
    return UIA_CONTROL_TYPE_ICONS[controlTypeId] ?? DefaultControlTypeIcon;
}
