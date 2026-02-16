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
import { SymbolFieldBtn, SymbolFieldLst, SymbolFieldTxt } from "pm-manifest-icons";
import {
    SymbolControlButton,
    SymbolControlScrollbar,
    SymbolControlSlider,
    SymbolControlStatusbar,
    SymbolControlTab,
    SymbolControlTabItem,
    SymbolControlThumb,
    SymbolControlTitlebar,
    SymbolControlTooltip,
    SymbolControlWindow,
    SymbolControlPane,
} from "@renderer/components/ui/icons/symbols/controls";
import { Symbol_uia_Toolbar, Symbol_uia_Tooltip } from "@renderer/components/ui/icons/symbols/ui-automation";
import { UIA_CONTROL_TYPE_FILMSTRIP_ICONS, DefaultFilmstripControlTypeIcon } from "./2-uia-control-type-icons-filmstrip";

const USE_FILMSTRIP = false; // Set to true to use the new pixel-art filmstrip icons

const iconClasses = "shrink-0 size-3 text-blue-700";

/**
 * Maps UIA Control Type IDs to corresponding Lucide icon elements.
 */
const UIA_LUCIDE_ICONS: Record<string, JSX.Element> = {
    "50000": <SymbolControlButton className={"shrink-0 size-5 text-blue-700"} />,      // Button
    "50001": <Calendar className={iconClasses} />,                                // Calendar
    "50002": <CheckSquare className={iconClasses} />,                             // CheckBox
    "50003": <SymbolFieldLst className={iconClasses} />,                          // ComboBox
    "50004": <Type className={iconClasses} />,                                    // Edit
    "50005": <Link className={iconClasses} />,                                    // Hyperlink
    "50006": <Image className={iconClasses} />,                                   // Image
    "50007": <ListOrdered className={iconClasses} />,                             // ListItem
    "50008": <List className={iconClasses} />,                                    // List
    "50009": <Menu className={iconClasses} />,                                    // Menu
    "50010": <MenuSquare className={iconClasses} />,                              // MenuBar
    "50011": <LayoutList className={iconClasses} />,                              // MenuItem
    "50012": <Loader className={iconClasses} />,                                  // ProgressBar
    "50013": <Circle className={iconClasses} />,                                  // RadioButton
    "50014": <SymbolControlScrollbar className={iconClasses} />,                   // ScrollBar
    "50015": <SymbolControlSlider className={iconClasses} />,                      // Slider
    "50016": <RotateCw className={iconClasses} />,                                // Spinner
    "50017": <SymbolControlStatusbar className={iconClasses} />,                   // StatusBar
    "50018": <SymbolControlTab className={iconClasses} />,                         // Tab
    "50019": <SymbolControlTabItem className={iconClasses} />,                     // TabItem
    "50020": <SymbolFieldTxt className={"shrink-0 size-4 text-blue-700"} />,      // Text
    "50021": <Symbol_uia_Toolbar className={iconClasses} />,                      // ToolBar
    "50022": <SymbolControlTooltip className={iconClasses} />,                    // ToolTip
    "50023": <TreeDeciduous className={iconClasses} />,                           // Tree
    "50024": <Folder className={iconClasses} />,                                  // TreeItem
    "50025": <Boxes className={iconClasses} />,                                   // Custom
    "50026": <Group className={iconClasses} />,                                   // Group
    "50027": <SymbolControlThumb className={iconClasses} />,                      // Thumb
    "50028": <Grid3X3 className={iconClasses} />,                                 // DataGrid
    "50029": <FileSpreadsheet className={iconClasses} />,                         // DataItem
    "50030": <FileText className={iconClasses} />,                                // Document
    "50031": <Square className={iconClasses} />,                                  // SplitButton
    "50032": <SymbolControlWindow className={iconClasses} />,                     // Window
    "50033": <SymbolControlPane className={iconClasses} />,                       // Pane
    "50034": <Heading className={iconClasses} />,                                 // Header
    "50035": <PanelTopInactive className={iconClasses} />,                        // HeaderItem
    "50036": <Table className={iconClasses} />,                                   // Table
    "50037": <SymbolControlTitlebar className={iconClasses} />,                   // TitleBar
    "50038": <Minus className={iconClasses} />,                                   // Separator
    "50039": <ZoomIn className={iconClasses} />,                                  // SemanticZoom
    "50040": <LayoutDashboard className={iconClasses} />,                         // AppBar
};

const DefaultLucideIcon: JSX.Element = <Box className={iconClasses} />;

/**
 * Maps UIA Control Type IDs to corresponding icon elements.
 * Control Type IDs are from UIAutomationClient.h
 * https://learn.microsoft.com/en-us/windows/win32/winauto/uiauto-controltype-ids
 */
const UIA_CONTROL_TYPE_ICONS: Record<string, JSX.Element> = USE_FILMSTRIP
    ? UIA_CONTROL_TYPE_FILMSTRIP_ICONS
    : UIA_LUCIDE_ICONS;

/**
 * Default icon for unknown control types
 */
const DefaultControlTypeIcon: JSX.Element = USE_FILMSTRIP
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
