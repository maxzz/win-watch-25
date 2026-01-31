import { useState } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { classNames } from "@renderer/utils";
import { type WindowInfo } from "@renderer/types";
import { appSettings } from "@renderer/store/1-ui-settings";
import { Crosshair } from "lucide-react";
import { Button } from "../ui/shadcn/button";
import { IconL_AppWindow, IconL_ChevronDown, IconL_ChevronRight, IconRefresh, Symbol_uia_Toolbar, Symbol_uia_Tooltip, Symbol_uia_Tooltip2 } from "../ui/icons";
import { activeHandleAtom, doHighlightSelectedWindowAtom, doRefreshWindowInfosAtom, windowInfosAtom } from "@renderer/store/2-atoms";

export function WindowTreePanel() {
    const windowInfos: WindowInfo[] = useAtomValue(windowInfosAtom);
    const [activeHandle, setActiveHandle] = useAtom(activeHandleAtom);

    return (
        <div className="h-full bg-card border-r flex flex-col">
            <Header />

            <div className="flex-1 overflow-auto">
                {windowInfos.map(
                    (windowInfo, i) => (
                        <WindowNode key={i} windowInfo={windowInfo} selectedHandle={activeHandle} onSelect={setActiveHandle} depth={0} />
                    )
                )}
            </div>
        </div>
    );
}

function WindowNode({ windowInfo, selectedHandle, onSelect, depth }: { windowInfo: WindowInfo; selectedHandle: string | null; onSelect: (h: string) => void; depth: number; }) {
    const [expanded, setExpanded] = useState(false);
    const isSelected = windowInfo.handle === selectedHandle;
    const hasChildren = windowInfo.children && windowInfo.children.length > 0;

    return (
        <div>
            <div
                className={classNames("px-2 py-0.5 cursor-pointer flex items-center", isSelected ? "bg-red-500 text-accent-foreground" : "hover:bg-accent/50")}
                style={{ paddingLeft: `${depth * 12 + 4}px` }}
                onClick={() => {
                    onSelect(windowInfo.handle);
                    //console.log("WindowNode clicked", windowInfo.handle);
                }}
            >
                <span
                    className="shrink-0 mr-1 size-4 flex items-center justify-center"
                    onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                >
                    {hasChildren && (expanded
                        ? <IconL_ChevronDown className="size-3.5" />
                        : <IconL_ChevronRight className="size-3.5" />
                    )}
                </span>

                <IconL_AppWindow className="shrink-0 mr-0.5 size-3.5 text-muted-foreground" />

                <span className="text-xs truncate" title={windowInfo.title || "No Title"}>
                    {/* <span className="ml-1 text-xs text-muted-foreground">
                        {window.handle}
                    </span> */}
                    {windowInfo.title || `[${windowInfo.processName}]`}
                </span>
            </div>

            {expanded && hasChildren && (
                <div>
                    {windowInfo.children!.map(
                        (child, i) => (
                            <WindowNode key={i} windowInfo={child} selectedHandle={selectedHandle} onSelect={onSelect} depth={depth + 1} />
                        )
                    )}
                </div>
            )}
        </div>
    );
}

function Header() {
    return (
        <div className="px-2 py-1 bg-muted/20 border-b flex justify-between items-center">
            <span className="text-xs font-semibold">
                Windows
            </span>
            <div className="flex items-center gap-1">
                <Button_WindowTreeRefresh />
                <Button_ToggleActiveWindowMonitoring />
                <Button_HighlightSelectedWindow />

                <Symbol_uia_Toolbar className="size-3.5" />
                <Symbol_uia_Tooltip className="size-3.5" />
                <Symbol_uia_Tooltip2 className="size-3.5" />
            </div>
        </div>
    );
}

function Button_WindowTreeRefresh() {
    const refreshWindowInfos = useSetAtom(doRefreshWindowInfosAtom);
    return (
        <Button
            variant="outline"
            size="xs"
            onClick={refreshWindowInfos}
            title="Refresh window list (refresh window tree)"
        >
            <IconRefresh className="size-3.5" />
        </Button>
    );
}

function Button_ToggleActiveWindowMonitoring() {
    const settings = useSnapshot(appSettings);
    const enabled = settings.activeWindowMonitoringEnabled;
    return (
        <Button
            variant="outline"
            size="xs"
            onClick={() => appSettings.activeWindowMonitoringEnabled = !enabled}
            title={enabled ? "Disable active window monitoring" : "Enable active window monitoring"}
        >
            {enabled ? "Auto" : "Manual"}
        </Button>
    );
}

function Button_HighlightSelectedWindow() {
    const activeHandle = useAtomValue(activeHandleAtom);
    const doHighlightSelectedWindow = useSetAtom(doHighlightSelectedWindowAtom);
    return (
        <Button
            variant="outline"
            size="xs"
            onClick={doHighlightSelectedWindow}
            disabled={!activeHandle}
            title="Highlight selected window"
        >
            <Crosshair className="size-3.5" />
        </Button>
    );
}
