import { useAtomValue } from "jotai";
import { useSnapshot } from "valtio/react";
import { appSettings } from "@renderer/store/1-ui-settings";
import { selectedControlAtom } from "@renderer/store/2-atoms";

export function ControlTreeHeader() {
    const { autoHighlightSelectedControl } = useSnapshot(appSettings);
    const selectedControl = useAtomValue(selectedControlAtom);

    return (
        <div className="px-2 py-1 border-b bg-muted/20 flex items-center select-none">
            <span className="text-xs font-semibold">
                Control Hierarchy
            </span>

            <label className="ml-auto flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer">
                <input
                    className="h-3 w-3 accent-foreground"
                    type="checkbox"
                    checked={autoHighlightSelectedControl}
                    onChange={async (e) => {
                        const enabled = e.target.checked;
                        appSettings.autoHighlightSelectedControl = enabled;

                        if (!enabled) {
                            try {
                                await tmApi.hideHighlight();
                            } catch (err) {
                                console.warn("Failed to hide highlight", err);
                            }
                            return;
                        }

                        // If a control is already selected, highlight it immediately.
                        const b = selectedControl?.bounds;
                        if (!b) return;
                        try {
                            await tmApi.highlightRect(
                                { left: b.left, top: b.top, right: b.right, bottom: b.bottom },
                                { blinkCount: 1, color: 0x00D4FF, borderWidth: 2 }
                            );
                        } catch (err) {
                            console.warn("Failed to highlight selected control", err);
                        }
                    }}
                />
                Auto-highlight
            </label>
        </div>
    );
}
