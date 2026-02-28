import { useEffect, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { AnimatePresence, motion } from "motion/react";
import { useSnapshot } from "valtio/react";
import { appSettings } from "@renderer/store/8-ui-settings";
import { selectedHwndAtom } from "@renderer/store/2-1-atoms-windows-list";
import { refreshWindowControlsTreeAtom } from "@renderer/store/2-2-1-atoms-controls-list";
import { setAutoHighlightSelectedControlAtom } from "@renderer/store/2-3-atoms-highlight";
import { emptyBoundsFlashTokenAtom } from "@renderer/store/2-4-atoms-bounds";
import { Button } from "../../ui/shadcn/button";
import { Label } from "../../ui/shadcn/label";
import { Switch } from "../../ui/shadcn/switch";
import { IconRefresh } from "../../ui/icons";

export function ControlTreeHeader() {
    return (
        <div className="px-2 py-1 pr-0 h-7 border-b bg-muted/20 flex items-center justify-between select-none">
            <span className="text-xs font-semibold flex items-center gap-1">
                Control Hierarchy
                <EmptyBoundsFlashBadge />
            </span>

            <div className="flex items-center gap-0">
                <ControlTreeAutoHighlightToggle />
                <Button_RefreshControlsTree />
            </div>
        </div>
    );
}

function EmptyBoundsFlashBadge() {
    const flashToken = useAtomValue(emptyBoundsFlashTokenAtom);
    const [activeToken, setActiveToken] = useState<number | null>(null);

    useEffect(
        () => {
            if (flashToken <= 0) {
                return;
            }
            setActiveToken(flashToken);
            const timeout = setTimeout(
                () => {
                    setActiveToken((current) => current === flashToken ? null : current);
                },
                1600
            );
            return () => clearTimeout(timeout);
        },
        [flashToken]
    );

    return (
        <AnimatePresence initial={false}>
            {activeToken !== null && (
                <motion.span
                    key={activeToken}
                    className="px-2 text-xs font-semibold text-white bg-red-500"
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: [0, 1, 1, 0], scale: [0.92, 1.06, 1.0, 0.98] }}
                    transition={{ duration: 1.55, times: [0, 0.2, 0.45, 1], ease: "easeOut" }}
                    exit={{ opacity: 0, transition: { duration: 0.08 } }}
                >
                    Empty
                </motion.span>
            )}
        </AnimatePresence>
    );
}

function Button_RefreshControlsTree() {
    const selectedHwnd = useAtomValue(selectedHwndAtom);
    const refreshControlsTree = useSetAtom(refreshWindowControlsTreeAtom);

    return (
        <Button
            variant="ghost"
            size="xs"
            onClick={() => void refreshControlsTree({ force: true })}
            title="Refresh controls tree"
            disabled={!selectedHwnd}
        >
            <IconRefresh className="size-3" />
        </Button>
    );
}

function ControlTreeAutoHighlightToggle() {
    const { autoHighlightSelectedControl } = useSnapshot(appSettings);
    const setAutoHighlightSelectedControl = useSetAtom(setAutoHighlightSelectedControlAtom);

    return (
        <Label className="text-xs font-normal text-muted-foreground cursor-pointer gap-0" title="Auto highlight the selected control">
            <span className="pb-0.5">Auto-highlight:</span>
            <Switch
                className="scale-75"
                checked={autoHighlightSelectedControl}
                onCheckedChange={(checked) => setAutoHighlightSelectedControl(checked)}
            />
        </Label>
    );
}
