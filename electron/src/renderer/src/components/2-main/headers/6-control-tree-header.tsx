import { useAtomValue, useSetAtom } from "jotai";
import { autoHighlightSelectedControlAtom, setAutoHighlightSelectedControlAtom } from "@renderer/store/2-atoms";

export function ControlTreeHeader() {
    const autoHighlight = useAtomValue(autoHighlightSelectedControlAtom);
    const setAutoHighlight = useSetAtom(setAutoHighlightSelectedControlAtom);

    return (
        <div className="px-2 py-1 border-b bg-muted/20 flex items-center select-none">
            <span className="text-xs font-semibold">
                Control Hierarchy
            </span>

            <label className="ml-auto flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer">
                <input
                    className="h-3 w-3 accent-foreground"
                    type="checkbox"
                    checked={autoHighlight}
                    onChange={(e) => setAutoHighlight(e.target.checked)}
                />
                Auto-highlight
            </label>
        </div>
    );
}
