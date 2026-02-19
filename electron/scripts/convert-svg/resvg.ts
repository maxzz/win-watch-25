import path from "node:path";
import { promises as fs } from "node:fs";
import { checkArgs, guessSymbolIdFromBaseName, parseArgs, toPascalCase } from "./1-cli-args";
import { parseSvg, svgInnerXmlToJsx } from "./2-parse-svg";
import { generateIconComponent, generateSymbolAndWrapperComponents, } from "./3-svg-to-tsx";

main().catch(
    (err) => {
        // eslint-disable-next-line no-console
        console.error(err instanceof Error ? err.message : err);
        process.exitCode = 1;
    }
);

async function main() {
    const args = parseArgs(process.argv.slice(2));
    const { exit, svgAbsolute } = await checkArgs(args);
    if (exit) {
        return;
    }

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
                `SVG: ${svgAbsolute}`,
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
