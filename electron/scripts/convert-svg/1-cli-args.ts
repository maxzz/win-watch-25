import path from "node:path";
import { promises as fs } from "node:fs";

export type Args = {
    svgFile: string;
    outDir?: string;
    outBase?: string;
    name?: string;
    symbolId?: string;
    tempSuffix: string;
    silent: boolean;
    force: boolean;
    dryRun: boolean;
    help: boolean;
};

export async function checkArgs(args: Args): Promise<{ exit: boolean; svgAbsolute: string }> {
    if (args.help) {
        // eslint-disable-next-line no-console
        console.log(getHelpText());
        return { exit: true, svgAbsolute: "" };
    }

    const svgAbsolute = path.resolve(process.cwd(), args.svgFile);
    const svgStat = await fs.stat(svgAbsolute).catch(() => null);
    if (!svgStat || !svgStat.isFile()) {
        throw new Error(`SVG file does not exist or is not a file: ${svgAbsolute}`);
    }

    return { exit: false, svgAbsolute };
}

export function parseArgs(argv: string[]): Args {
    const args: Args = {
        svgFile: "",
        tempSuffix: "-temp",
        silent: false,
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

        if (a === "--silent") {
            args.silent = true;
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

export function getHelpText() {
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
        "  --silent                   Do not wait for keypress on exit",
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

// Utilities

export function guessSymbolIdFromBaseName(baseName: string): string | null {
    // e.g. "1-control-button" => "control-button"
    const idx = baseName.indexOf("-");
    if (idx < 0) return null;
    const prefix = baseName.slice(0, idx);
    if (!/^\d+$/.test(prefix)) return null;
    return baseName.slice(idx + 1);
}

export function toPascalCase(id: string): string {
    return id
        .split(/[^a-zA-Z0-9]+/g)
        .filter(Boolean)
        .map((p) => (p ? p[0]!.toUpperCase() + p.slice(1) : ""))
        .join("");
}
