import { useSetAtom } from "jotai";
import { useEffect, useRef } from "react";
import { setSvgSymbolsAtom } from "./7-collect-svg-symbols";

// Create an explicit module dependency so Vite HMR can notify us when any symbol module updates.
import "@renderer/components/ui/icons/symbols";

/**
 * Dev helper: reuse the already-mounted `#svgfont > defs` (from `<UISymbolDefs />`)
 * and re-collect symbol ids on Vite HMR updates so the spy grid stays in sync.
 *
 * Does NOT inject/duplicate any `<symbol>` nodes.
 */
export function SpyHmrWatchExistingSvgFontDefs({ fontID = "svgfont" }: { fontID?: string; }) {
    const recollect = useSetAtom(setSvgSymbolsAtom);
    const recollectRef = useRef(recollect);
    recollectRef.current = recollect;

    // Initial collect (after mount) to avoid any ordering/race issues.
    useEffect(() => {
        const t = window.setTimeout(() => recollectRef.current({ fontID }), 0);
        return () => window.clearTimeout(t);
    }, [fontID]);

    // Re-collect when symbol modules hot-update.
    const didRegisterRef = useRef(false);
    useEffect(() => {
        if (!import.meta.env.DEV) return;
        if (!import.meta.hot) return;
        if (didRegisterRef.current) return;
        didRegisterRef.current = true;

        const handler = () => recollectRef.current({ fontID });
        import.meta.hot.accept("@renderer/components/ui/icons/symbols", handler);
    }, [fontID]);

    return null;
}

