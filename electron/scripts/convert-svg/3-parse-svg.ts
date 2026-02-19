export function parseSvg(svgSrc: string): { viewBox: string; innerXml: string; } {
    const src = svgSrc.replace(/^\uFEFF/, "");
    const noXmlDecl = src.replace(/<\?xml[\s\S]*?\?>\s*/i, "");

    const openMatch = noXmlDecl.match(/<svg\b([\s\S]*?)>/im);
    if (!openMatch) {
        throw new Error("Could not find <svg ...> open tag.");
    }

    const openTagAttrs = openMatch[1] ?? "";
    const viewBox = openTagAttrs.match(/\bviewBox\s*=\s*["']([^"']+)["']/im)?.[1] ?? "0 0 24 24";

    const innerMatch = noXmlDecl.match(/<svg\b[\s\S]*?>([\s\S]*?)<\/svg>/im);
    if (!innerMatch) {
        throw new Error("Could not find </svg> close tag.");
    }

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
    s = s.replace(
        /<([a-zA-Z][\w:-]*)([^>]*)>/g, // regex to match tag name, whitespace, attributes
        (m, tagName: string, attrs: string) => {
            // Skip things that look like closing tags or directives (defensive).
            if (m.startsWith("</") || m.startsWith("<!")) return m;
            const fixedAttrs = rewriteTagAttributes(attrs);
            return `<${tagName}${fixedAttrs}>`;
        }
    );

    s = formatPathTags(s);

    return s;
}

function formatPathTags(input: string): string {
    // Ensure <path .../> is formatted like:
    // <path
    //     other="attrs"
    //     d="..."
    // />
    return input.replace(/(^[ \t]*)<path\b([\s\S]*?)\/>/gm, (full, indent: string, attrsBlock: string) => {
        const dMatch = attrsBlock.match(/\bd\s*=\s*(["'])([\s\S]*?)\1/m);
        if (!dMatch) return full;

        const dQuote = dMatch[1]!;
        const dValue = dMatch[2]!;

        const withoutD = attrsBlock.replace(dMatch[0], " ");
        const otherAttrs = withoutD
            .split(/\r?\n/g)
            .map((l) => l.trim())
            .filter(Boolean)
            .join(" ")
            .trim();

        const attrIndent = `${indent}    `;
        const otherLine = otherAttrs ? `${attrIndent}${otherAttrs}\n` : "";

        return `${indent}<path\n${otherLine}${attrIndent}d=${dQuote}${dValue}${dQuote}\n${indent}/>`;
    });
}

function rewriteTagAttributes(attrs: string): string {
    let a = attrs;

    // Drop xmlns attributes; they are noise in TSX.
    a = a.replace(/\s+xmlns(?::[a-zA-Z0-9_-]+)?\s*=\s*["'][^"']*["']/g, "");

    // Rewrite attr names and style=... values.
    a = a.replace(
        /(\s+)([^\s=/>]+)(\s*=\s*)(?:"([^"]*)"|'([^']*)')/g, // regex to match attribute name, whitespace, equals sign, value (optionally quoted)
        (_m, ws: string, rawName: string, eq: string, v1: string | undefined, v2: string | undefined) => {
            const quote = v1 !== undefined ? `"` : `'`;
            const value = (v1 ?? v2 ?? "").toString();

            const name = normalizeSvgAttrName(rawName);
            if (name === "style") {
                const styleExpr = cssStyleToJsxObject(value);
                return !styleExpr ? "" : `${ws}style={${styleExpr}}`; // avoid empty style={}
            }

            return `${ws}${name}${eq}${quote}${value}${quote}`; // return attribute with rewritten name and value
        }
    );

    return a;
}

function normalizeSvgAttrName(name: string): string {
    if (name === "class") return "className";
    if (name.startsWith("aria-")) return name;
    if (name.startsWith("data-")) return name;

    if (name === "xlink:href") return "xlinkHref"; // actually don't need it since we dropped xmlns:xlink in rewriteTagAttributes()

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
        .map(
            (pair) => {
                const idx = pair.indexOf(":");
                if (idx < 0) {
                    return null; // skip if no colon
                }
                const k = pair.slice(0, idx).trim();
                const v = pair.slice(idx + 1).trim();
                if (!k || !v) {
                    return null; // skip if key or value is empty
                }
                const rv = { key: cssKeyToCamel(k), value: v }; // return key and value object
                return rv;
            }
        )
        .filter((x): x is { key: string; value: string; } => !!x);

    const rv = items.length
        ? `{ ${items.map((it) => `${it.key}: ${JSON.stringify(it.value)}`).join(", ")} }` // return style object if items are present
        : null;

    return rv;
}

function cssKeyToCamel(key: string): string {
    // e.g. "stroke-width" => "strokeWidth"
    const parts = key.split("-").filter(Boolean);
    const rv = parts.length
        ? [parts[0]!, ...parts.slice(1).map((p) => (p ? p[0]!.toUpperCase() + p.slice(1) : ""))].join("") // return camel case key
        : key; // return original key if no parts
    return rv; // return camel case key or original key
}
