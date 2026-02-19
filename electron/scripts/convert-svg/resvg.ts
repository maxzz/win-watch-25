import { promises as fs } from "node:fs";
import path from "node:path";

main().catch(
    (err) => {
        // eslint-disable-next-line no-console
        console.error(err instanceof Error ? err.message : err);
        process.exitCode = 1;
    }
);

async function main() {
    const args = parseArgs(process.argv.slice(2));
    if (args.help) {
        // eslint-disable-next-line no-console
        console.log(getHelpText());
        return;
    }

    const svgAbs = path.resolve(process.cwd(), args.svgFile);
    const svgStat = await fs.stat(svgAbs).catch(() => null);
    if (!svgStat || !svgStat.isFile()) {
        throw new Error(`SVG file does not exist or is not a file: ${svgAbs}`);
    }

    const svgSrc = await fs.readFile(svgAbs, "utf8");
    const { viewBox, innerXml } = parseSvg(svgSrc);
    const innerJsx = svgInnerXmlToJsx(innerXml);

    const svgDirAbs = path.dirname(svgAbs);
    const svgBase = path.basename(svgAbs, path.extname(svgAbs));
    const outDirAbs = path.resolve(process.cwd(), args.outDir ?? svgDirAbs);
    const outBase = args.outBase ?? svgBase;

    const inferredSymbolId = guessSymbolIdFromBaseName(outBase) ?? outBase;
    const symbolId = args.symbolId ?? inferredSymbolId;

    const inferredName = toPascalCase(symbolId);
    const baseNamePascal = args.name ?? inferredName;

    const symbolComponentName = `SvgSymbol${baseNamePascal}`;
    const wrapperComponentName = `Symbol${baseNamePascal}`;
    const iconComponentName = `Icon${baseNamePascal}`;

    const outNormalPath = path.join(outDirAbs, `${outBase}.tsx`);
    const outTempPath = path.join(outDirAbs, `${outBase}${args.tempSuffix}.tsx`);

    const normalTsx = generateSymbolAndWrapperComponents({
        symbolComponentName,
        wrapperComponentName,
        symbolId,
        viewBox,
        innerJsx,
    });

    const tempTsx = generateIconComponent({
        iconComponentName,
        viewBox,
        innerJsx,
    });

    if (args.dryRun) {
        // eslint-disable-next-line no-console
        console.log(
            [
                `SVG: ${svgAbs}`,
                `Out dir: ${outDirAbs}`,
                `Normal file: ${outNormalPath}`,
                `Temp file: ${outTempPath}`,
                `Symbol id: ${symbolId}`,
                `Components: ${symbolComponentName}, ${wrapperComponentName}, ${iconComponentName}`,
            ].join("\n")
        );
        return;
    }

    await fs.mkdir(outDirAbs, { recursive: true });

    if (!args.force) {
        const existingNormal = await fs.stat(outNormalPath).catch(() => null);
        if (existingNormal) throw new Error(`Refusing to overwrite existing file (use --force): ${outNormalPath}`);

        const existingTemp = await fs.stat(outTempPath).catch(() => null);
        if (existingTemp) throw new Error(`Refusing to overwrite existing file (use --force): ${outTempPath}`);
    }

    await fs.writeFile(outNormalPath, normalTsx, "utf8");
    await fs.writeFile(outTempPath, tempTsx, "utf8");

    // eslint-disable-next-line no-console
    console.log(`Generated 2 component file(s):\n- ${outNormalPath}\n- ${outTempPath}`);
}

type Args = {
    svgFile: string;
    outDir?: string;
    outBase?: string;
    name?: string;
    symbolId?: string;
    tempSuffix: string;
    force: boolean;
    dryRun: boolean;
    help: boolean;
};

function parseArgs(argv: string[]): Args {
    const args: Args = {
        svgFile: "",
        tempSuffix: "-temp",
        force: false,
        dryRun: false,
        help: false,
    };

    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];

        if (a === "--help" || a === "-h") {
            args.help = true;
            continue;
        }

        if (a === "--out-dir" || a === "-o") {
            args.outDir = argv[++i] ?? "";
            continue;
        }

        if (a === "--out-base") {
            args.outBase = argv[++i] ?? "";
            continue;
        }

        if (a === "--name") {
            args.name = argv[++i] ?? "";
            continue;
        }

        if (a === "--symbol-id" || a === "--id") {
            args.symbolId = argv[++i] ?? "";
            continue;
        }

        if (a === "--temp-suffix") {
            args.tempSuffix = argv[++i] ?? "";
            continue;
        }

        if (a === "--force" || a === "-f") {
            args.force = true;
            continue;
        }

        if (a === "--dry-run") {
            args.dryRun = true;
            continue;
        }

        if (!a.startsWith("-") && !args.svgFile) {
            args.svgFile = a;
            continue;
        }

        throw new Error(`Unknown argument: ${a}`);
    }

    if (!args.help && !args.svgFile) {
        throw new Error(
            [
                "\n",
                "Missing required argument: <svg-file>.",
                "",
                "Example:",
                '  pnpm tsx convert-svg/cli.ts "electron/src/assets/icons/controls/svg/window.svg"',
                `\n`,
            ].join("\n")
        );
    }

    if (args.outDir !== undefined && !args.outDir) throw new Error("Invalid --out-dir (empty).");
    if (args.outBase !== undefined && !args.outBase) throw new Error("Invalid --out-base (empty).");
    if (args.name !== undefined && !args.name) throw new Error("Invalid --name (empty).");
    if (args.symbolId !== undefined && !args.symbolId) throw new Error("Invalid --symbol-id/--id (empty).");
    if (!args.tempSuffix) throw new Error("Invalid --temp-suffix (empty).");

    return args;
}

function getHelpText() {
    return [
        "react from svg",
        "",
        "Generate 2 React TSX components from an SVG file:",
        "- <name>.tsx: <symbol> + <svg><use/></svg> wrapper",
        `- <name>${"-temp"}.tsx (default): inline <svg> icon component`,
        "",
        "Usage:",
        "  pnpm tsx resvg.ts <svg-file> [options]",
        "",
        "Options:",
        "  -h, --help                 Show help",
        "  -o, --out-dir <dir>         Output directory (default: SVG file directory)",
        "  --out-base <base>           Output file base name (default: SVG filename without extension)",
        "  --name <PascalName>         Base name for exported components (default: derived from symbol id)",
        "  --symbol-id, --id <id>      <symbol id=\"...\"> + <use xlinkHref=\"#...\"/> (default: derived from filename)",
        "  --temp-suffix <suffix>      Temp file suffix (default: -temp)",
        "  -f, --force                 Overwrite existing files",
        "  --dry-run                   Print what would be generated without writing files",
        "",
        "Derivation defaults:",
        "  - If the output base looks like '1-control-button', the default symbol id becomes 'control-button'.",
        "  - Component names are derived from symbol id: 'control-button' => ControlButton.",
        "",
    ].join("\n");
}

function parseSvg(svgSrc: string): { viewBox: string; innerXml: string; } {
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

function svgInnerXmlToJsx(innerXml: string): string {
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
        .filter((x): x is { key: string; value: string; } => !!x);

    if (!items.length) return null;

    return `{ ${items.map((it) => `${it.key}: ${JSON.stringify(it.value)}`).join(", ")} }`;
}

function cssKeyToCamel(key: string): string {
    // e.g. "stroke-width" => "strokeWidth"
    const parts = key.split("-").filter(Boolean);
    if (!parts.length) return key;
    return [parts[0]!, ...parts.slice(1).map((p) => (p ? p[0]!.toUpperCase() + p.slice(1) : ""))].join("");
}

function guessSymbolIdFromBaseName(baseName: string): string | null {
    // e.g. "1-control-button" => "control-button"
    const idx = baseName.indexOf("-");
    if (idx < 0) return null;
    const prefix = baseName.slice(0, idx);
    if (!/^\d+$/.test(prefix)) return null;
    return baseName.slice(idx + 1);
}

function toPascalCase(id: string): string {
    return id
        .split(/[^a-zA-Z0-9]+/g)
        .filter(Boolean)
        .map((p) => (p ? p[0]!.toUpperCase() + p.slice(1) : ""))
        .join("");
}

function indentBlock(block: string, indent: string): string {
    const normalized = normalizeBlock(block);
    if (!normalized.trim()) return "";
    return normalized
        .split(/\r?\n/g)
        .map((line) => `${indent}${line}`.trimEnd())
        .join("\n");
}

function normalizeBlock(block: string): string {
    const lines = block.split(/\r?\n/g);

    while (lines.length && !lines[0]!.trim()) lines.shift();
    while (lines.length && !lines[lines.length - 1]!.trim()) lines.pop();

    const nonEmpty = lines.filter((l) => l.trim().length > 0);
    if (!nonEmpty.length) return "";

    const indents = nonEmpty.map((l) => (l.match(/^\s*/)?.[0].length ?? 0));
    const minIndent = Math.min(...indents);
    return lines.map((l) => l.slice(minIndent)).join("\n");
}

function generateSymbolAndWrapperComponents(params: {
    symbolComponentName: string;
    wrapperComponentName: string;
    symbolId: string;
    viewBox: string;
    innerJsx: string;
}) {
    const innerIndented = indentBlock(params.innerJsx, "            ");
    const innerSection = innerIndented ? `\n${innerIndented}` : "";

    return [
        'import { type HTMLAttributes, type SVGAttributes } from "react";',
        'import { classNames } from "@renderer/utils";',
        "",
        `export function ${params.symbolComponentName}() {`,
        "    return (",
        `        <symbol id="${params.symbolId}" viewBox="${params.viewBox}">` + innerSection,
        "        </symbol>",
        "    );",
        "}",
        "",
        `export function ${params.wrapperComponentName}({ className, title, children, ...rest }: SVGAttributes<SVGSVGElement> & HTMLAttributes<SVGSVGElement>) {`,
        "    return (",
        '        <svg className={classNames("fill-none stroke-current", className)} {...rest}>',
        "            {title && <title>{title}</title>}",
        "            {children}",
        `            <use xlinkHref="#${params.symbolId}" />`,
        "        </svg>",
        "    );",
        "}",
        "",
    ].join("\n");
}

function generateIconComponent(params: { iconComponentName: string; viewBox: string; innerJsx: string; }) {
    const innerIndented = indentBlock(params.innerJsx, "            ");
    const innerSection = innerIndented ? `\n${innerIndented}` : "";

    return [
        'import { type HTMLAttributes } from "react";',
        'import { classNames } from "@renderer/utils";',
        "",
        `export function ${params.iconComponentName}({ className, title, ...rest }: HTMLAttributes<SVGSVGElement>) {`,
        "    return (",
        `        <svg className={classNames("fill-none stroke-current", className)} viewBox="${params.viewBox}" {...rest}>`,
        "            {title && <title>{title}</title>}" + innerSection,
        "        </svg>",
        "    );",
        "}",
        "",
    ].join("\n");
}
