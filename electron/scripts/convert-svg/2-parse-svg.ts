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
