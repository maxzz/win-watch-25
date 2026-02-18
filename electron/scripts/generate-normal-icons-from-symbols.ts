import { promises as fs } from "node:fs";
import path from "node:path";

type Args = {
    inDir: string;
    outDir?: string;
    clean: boolean;
};

async function main() {
    const args = parseArgs(process.argv.slice(2));

    const inDirAbs = path.resolve(process.cwd(), args.inDir);
    const outDirAbs = path.resolve(process.cwd(), args.outDir ?? `${inDirAbs}-temp`);

    const inStat = await fs.stat(inDirAbs).catch(() => null);
    if (!inStat || !inStat.isDirectory()) {
        throw new Error(`Input folder does not exist or is not a directory: ${inDirAbs}`);
    }

    if (args.clean) {
        await fs.rm(outDirAbs, { recursive: true, force: true }).catch(() => undefined);
    }
    await fs.mkdir(outDirAbs, { recursive: true });

    const entries = await fs.readdir(inDirAbs, { withFileTypes: true });
    const files = entries
        .filter((e) => e.isFile())
        .map((e) => e.name)
        .filter((name) => name.endsWith(".tsx"))
        .filter((name) => name !== "index.tsx")
        .sort((a, b) => a.localeCompare(b));

    const generatedStems: string[] = [];

    for (const fileName of files) {
        const srcPath = path.join(inDirAbs, fileName);
        const src = await fs.readFile(srcPath, "utf8");

        const symbolBlock = extractFirstSymbolBlock(src);
        if (!symbolBlock) continue;

        const { id, viewBox, inner } = parseSymbolBlock(symbolBlock);
        const symbolId = id ?? guessSymbolIdFromFileName(fileName);
        if (!symbolId) continue;

        const componentName = `Icon${toPascalCase(symbolId)}`;
        const outPath = path.join(outDirAbs, fileName);
        const out = generateIconComponent({ componentName, viewBox, inner });

        await fs.writeFile(outPath, out, "utf8");
        generatedStems.push(path.basename(fileName, ".tsx"));
    }

    const indexPath = path.join(outDirAbs, "index.tsx");
    const index = generatedStems.length
        ? generatedStems.map((stem) => `export * from "./${stem}";`).join("\n") + "\n"
        : "export {};\n";

    await fs.writeFile(indexPath, index, "utf8");

    // eslint-disable-next-line no-console
    console.log(`Generated ${generatedStems.length} icon component(s) into: ${outDirAbs}`);
}

function parseArgs(argv: string[]): Args {
    const args: Args = { inDir: "", clean: true };

    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === "--in" || a === "-i") {
            args.inDir = argv[++i] ?? "";
            continue;
        }
        if (a === "--out" || a === "-o") {
            args.outDir = argv[++i] ?? "";
            continue;
        }
        if (a === "--no-clean") {
            args.clean = false;
            continue;
        }
        if (a === "--clean") {
            args.clean = true;
            continue;
        }
    }

    if (!args.inDir) {
        throw new Error(
            [
                "\n",
                "Missing required argument --in <folder>.",
                "",
                "Example:",
                '  pnpm --filter win-watch-electron run gen:icons-temp -- --in "src/renderer/src/components/ui/icons/symbols/controls"',
                `\n`,
            ].join("\n")
        );
    }

    return args;
}

function extractFirstSymbolBlock(src: string): string | null {
    const m = src.match(/<symbol\b[\s\S]*?<\/symbol>/m);
    return m ? m[0] : null;
}

function parseSymbolBlock(symbolBlock: string): { id: string | null; viewBox: string; inner: string; } {
    const openTagMatch = symbolBlock.match(/<symbol\b([\s\S]*?)>/m);
    const openTag = openTagMatch?.[1] ?? "";
    const id = openTag.match(/\bid\s*=\s*["']([^"']+)["']/m)?.[1] ?? null;
    const viewBox = openTag.match(/\bviewBox\s*=\s*["']([^"']+)["']/m)?.[1] ?? "0 0 24 24";

    const innerMatch = symbolBlock.match(/<symbol\b[\s\S]*?>([\s\S]*?)<\/symbol>/m);
    // Keep original indentation; `normalizeBlock()` will deindent reliably.
    const inner = (innerMatch?.[1] ?? "").trimEnd();

    return { id, viewBox, inner };
}

function guessSymbolIdFromFileName(fileName: string): string | null {
    // e.g. "1-control-button.tsx" => "control-button"
    const base = fileName.replace(/\.tsx$/i, "");
    const idx = base.indexOf("-");
    if (idx < 0) return null;
    return base.slice(idx + 1);
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

function generateIconComponent({ componentName, viewBox, inner }: { componentName: string; viewBox: string; inner: string; }) {
    const innerIndented = indentBlock(inner, "            ");
    const innerSection = innerIndented ? `\n${innerIndented}` : "";

    return [
        'import { type HTMLAttributes } from "react";',
        'import { classNames } from "@renderer/utils";',
        "",
        `export function ${componentName}({ className, title, ...rest }: HTMLAttributes<SVGSVGElement>) {`,
        "    return (",
        `        <svg className={classNames("fill-none stroke-current", className)} viewBox="${viewBox}" {...rest}>`,
        "            {title && <title>{title}</title>}" + innerSection,
        "        </svg>",
        "    );",
        "}",
        "",
    ].join("\n");
}

main().catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
});

