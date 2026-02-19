export function parseSvg(svgSrc: string): { viewBox: string; innerXml: string } {
    const src = svgSrc.replace(/^\uFEFF/, "");
    const noXmlDecl = src.replace(/<\?xml[\s\S]*?\?>\s*/i, "");

    const openMatch = noXmlDecl.match(/<svg\b([\s\S]*?)>/im);
    if (!openMatch) throw new Error("Could not find <svg ...> open tag.");

    const openTagAttrs = openMatch[1] ?? "";
    const viewBox = openTagAttrs.match(/\bviewBox\s*=\s*["']([^"']+)["']/im)?.[1] ?? "0 0 24 24";

    const innerMatch = noXmlDecl.match(/<svg\b[\s\S]*?>([\s\S]*?)<\/svg>/im);
    if (!innerMatch) throw new Error("Could not find </svg> close tag.");

    const innerXml = (innerMatch[1] ?? "").trimEnd();
    return { viewBox, innerXml };
}

export function svgInnerXmlToJsx(innerXml: string): string {
    let s = innerXml;

    // Convert XML comments to JSX comments.
    s = s.replace(/<!--([\s\S]*?)-->/g, (_m, body: string) => `{/* ${body.trim()} */}`);

    // Convert <style> ... </style> blocks to JSX-safe template literals.
    // JSX treats "{" and "}" as expression delimiters even inside text nodes.
    s = s.replace(/<style\b([^>]*)>([\s\S]*?)<\/style>/gim, (_m, attrs: string, css: string) => {
        const attrsFixed = rewriteTagAttributes(attrs);
        const cssText = css.replace(/\r\n/g, "\n").trim();
        return `<style${attrsFixed}>{\`\n${cssText}\n\`}</style>`;
    });

    // Rewrite attributes for all opening tags.
    s = s.replace(/<([a-zA-Z][\w:-]*)([^>]*)>/g, (m, tagName: string, attrs: string) => {
        // Skip things that look like closing tags or directives (defensive).
        if (m.startsWith("</") || m.startsWith("<!")) return m;
        const fixedAttrs = rewriteTagAttributes(attrs);
        return `<${tagName}${fixedAttrs}>`;
    });

    return s;
}

function rewriteTagAttributes(attrs: string): string {
    let a = attrs;

    // Drop xmlns attributes; they are noise in TSX.
    a = a.replace(/\s+xmlns(?::[a-zA-Z0-9_-]+)?\s*=\s*["'][^"']*["']/g, "");

    // Rewrite attr names and style=... values.
    a = a.replace(
        /(\s+)([^\s=/>]+)(\s*=\s*)(?:"([^"]*)"|'([^']*)')/g,
        (_m, ws: string, rawName: string, eq: string, v1: string | undefined, v2: string | undefined) => {
            const quote = v1 !== undefined ? `"` : `'`;
            const value = (v1 ?? v2 ?? "").toString();

            const name = normalizeSvgAttrName(rawName);
            if (name === "style") {
                const styleExpr = cssStyleToJsxObject(value);
                if (!styleExpr) return "";
                return `${ws}style={${styleExpr}}`;
            }

            return `${ws}${name}${eq}${quote}${value}${quote}`;
        }
    );

    return a;
}

function normalizeSvgAttrName(name: string): string {
    if (name === "class") return "className";
    if (name.startsWith("aria-")) return name;
    if (name.startsWith("data-")) return name;

    if (name === "xlink:href") return "xlinkHref";

    const map: Record<string, string> = {
        "stroke-width": "strokeWidth",
        "stroke-linecap": "strokeLinecap",
        "stroke-linejoin": "strokeLinejoin",
        "stroke-miterlimit": "strokeMiterlimit",
        "fill-rule": "fillRule",
        "clip-rule": "clipRule",
        "stop-color": "stopColor",
        "stop-opacity": "stopOpacity",
        "font-family": "fontFamily",
        "font-size": "fontSize",
        "text-anchor": "textAnchor",
        "dominant-baseline": "dominantBaseline",
        "vector-effect": "vectorEffect",
        "color-interpolation-filters": "colorInterpolationFilters",
    };

    return map[name] ?? name;
}

function cssStyleToJsxObject(styleText: string): string | null {
    const items = styleText
        .split(";")
        .map((p) => p.trim())
        .filter(Boolean)
        .map((pair) => {
            const idx = pair.indexOf(":");
            if (idx < 0) return null;
            const k = pair.slice(0, idx).trim();
            const v = pair.slice(idx + 1).trim();
            if (!k || !v) return null;
            return { key: cssKeyToCamel(k), value: v };
        })
        .filter((x): x is { key: string; value: string } => !!x);

    if (!items.length) return null;

    return `{ ${items.map((it) => `${it.key}: ${JSON.stringify(it.value)}`).join(", ")} }`;
}

function cssKeyToCamel(key: string): string {
    // e.g. "stroke-width" => "strokeWidth"
    const parts = key.split("-").filter(Boolean);
    if (!parts.length) return key;
    return [parts[0]!, ...parts.slice(1).map((p) => (p ? p[0]!.toUpperCase() + p.slice(1) : ""))].join("");
}
