import path from "node:path";
import { promises as fs } from "node:fs";
import type { Args } from "./1-cli-args";
import { guessSymbolIdFromBaseName, toPascalCase } from "./1-cli-args";
import { parseSvg, svgInnerXmlToJsx } from "./3-parse-svg";

export type PrepareOutputResult = {
    viewBox: string;                // view box attribute value, e.g. "0 0 24 24"
    innerJsx: string;               // inner XML converted to JSX, e.g. "<path d="M12 2C6.48 2 2 8h2v2h-2z"/>"
    symbolId: string;               // symbol id attribute value, e.g. "window"
    symbolComponentName: string;    // symbol component name, e.g. "SvgSymbolWindow"
    wrapperComponentName: string;   // wrapper component name, e.g. "SymbolWindow"
    iconComponentName: string;      // icon component name, e.g. "IconWindow"
    outDirAbs: string;              // absolute path to output directory, e.g. "electron/src/assets/icons/controls"
    outNormalPath: string;          // absolute path to normal output file, e.g. "electron/src/assets/icons/controls/window.tsx"
    outTempPath: string;            // absolute path to temp output file, e.g. "electron/src/assets/icons/controls/window-temp.tsx"
};

export async function prepareOutput(args: Args, svgAbsolute: string): Promise<PrepareOutputResult> {
    const svgSrc = await fs.readFile(svgAbsolute, "utf8");
    const { viewBox, innerXml } = parseSvg(svgSrc);
    const innerJsx = svgInnerXmlToJsx(innerXml);

    const svgDirAbs = path.dirname(svgAbsolute);
    const svgBase = path.basename(svgAbsolute, path.extname(svgAbsolute));
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

    return {
        viewBox,
        innerJsx,
        symbolId,
        symbolComponentName,
        wrapperComponentName,
        iconComponentName,
        outDirAbs,
        outNormalPath,
        outTempPath,
    };
}
