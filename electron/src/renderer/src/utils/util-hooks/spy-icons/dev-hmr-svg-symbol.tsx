import { type ReactElement, type ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";

type PortalProps = {
    /**
     * Target hidden sprite id.
     *
     * Note: your existing symbol tooling (`7-collect-svg-symbols.ts`) reads from `#svgfont > defs`,
     * so the default intentionally matches that.
     */
    spriteId?: string;
    /**
     * If the sprite isn't present yet, create a hidden one under `document.body`.
     * This is convenient for isolated tweaking screens.
     */
    ensureSprite?: boolean;
    children: ReactNode;
};

/**
 * Dev helper: inject live-edited `<symbol>` definitions into an SVG sprite and let Vite HMR update them.
 *
 * Usage:
 *
 * ```tsx
 * <DevHmrSvgSymbolDefsPortal>
 *   <symbol id="control-button" viewBox="0 0 24 24">
 *     <path d="..." />
 *   </symbol>
 * </DevHmrSvgSymbolDefsPortal>
 * ```
 */
export function DevHmrSvgSymbolDefsPortal({ spriteId = "svgfont", ensureSprite = true, children }: PortalProps) {
    const [defsEl, setDefsEl] = useState<SVGDefsElement | null>(null);

    useEffect(() => {
        const defs = findOrCreateDefs({ spriteId, ensureSprite });
        setDefsEl(defs);
    }, [spriteId, ensureSprite]);

    if (!defsEl) return null;
    return createPortal(children, defsEl);
}

type DevHmrSvgSymbolProps = Omit<PortalProps, "children"> & {
    symbol: ReactElement;
};

/**
 * Convenience wrapper when you already have a `<symbol ...>` JSX element.
 */
export function DevHmrSvgSymbol({ symbol, ...rest }: DevHmrSvgSymbolProps) {
    return <DevHmrSvgSymbolDefsPortal {...rest}>{symbol}</DevHmrSvgSymbolDefsPortal>;
}

function findOrCreateDefs({ spriteId, ensureSprite }: { spriteId: string; ensureSprite: boolean; }): SVGDefsElement | null {
    const id = cssEscape(spriteId);
    const existing = document.querySelector(`#${id} > defs`) as SVGDefsElement | null;
    if (existing) return existing;
    if (!ensureSprite) return null;
    return createHiddenSprite(spriteId);
}

function createHiddenSprite(spriteId: string): SVGDefsElement {
    // If the sprite exists but doesn't have <defs>, ensure it.
    const existing = document.getElementById(spriteId) as SVGSVGElement | null;
    if (existing) {
        const defs = existing.querySelector("defs") as SVGDefsElement | null;
        if (defs) return defs;
        const newDefs = document.createElementNS("http://www.w3.org/2000/svg", "defs") as SVGDefsElement;
        existing.appendChild(newDefs);
        return newDefs;
    }

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg") as SVGSVGElement;
    svg.setAttribute("id", spriteId);
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svg.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
    svg.setAttribute("version", "1.1");
    svg.style.position = "absolute";
    svg.style.width = "0";
    svg.style.height = "0";
    svg.style.overflow = "hidden";

    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs") as SVGDefsElement;
    svg.appendChild(defs);
    document.body.appendChild(svg);
    return defs;
}

function cssEscape(value: string): string {
    // `CSS.escape` is widely supported in Chromium, but keep a safe fallback.
    if (globalThis.CSS && typeof globalThis.CSS.escape === "function") {
        return globalThis.CSS.escape(value);
    }
    return value.replace(/[^a-zA-Z0-9_-]/g, "\\$&");
}

