import path from "node:path";
import { promises as fs } from "node:fs";
import type { Args } from "./1-cli-args";
import { guessSymbolIdFromBaseName, toPascalCase } from "./1-cli-args";
import { parseSvg, svgInnerXmlToJsx } from "./2-parse-svg";

export type PrepareOutputResult = {
    viewBox: string;
    innerJsx: string;
    symbolId: string;
    symbolComponentName: string;
    wrapperComponentName: string;
    iconComponentName: string;
    outDirAbs: string;
    outNormalPath: string;
    outTempPath: string;
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
