import { promises as fs } from "node:fs";
import { checkArgs, parseArgs } from "./1-cli-args";
import { prepareOutput } from "./4-prepare-output";
import { generateIconComponent, generateSymbolAndWrapperComponents } from "./3-svg-to-tsx";

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

    const prep = await prepareOutput(args, svgAbsolute);

    const normalTsx = generateSymbolAndWrapperComponents({
        symbolComponentName: prep.symbolComponentName,
        wrapperComponentName: prep.wrapperComponentName,
        symbolId: prep.symbolId,
        viewBox: prep.viewBox,
        innerJsx: prep.innerJsx,
    });

    const tempTsx = generateIconComponent({
        iconComponentName: prep.iconComponentName,
        viewBox: prep.viewBox,
        innerJsx: prep.innerJsx,
    });

    if (args.dryRun) {
        // eslint-disable-next-line no-console
        console.log(
            [
                `SVG: ${svgAbsolute}`,
                `Out dir: ${prep.outDirAbs}`,
                `Normal file: ${prep.outNormalPath}`,
                `Temp file: ${prep.outTempPath}`,
                `Symbol id: ${prep.symbolId}`,
                `Components: ${prep.symbolComponentName}, ${prep.wrapperComponentName}, ${prep.iconComponentName}`,
            ].join("\n")
        );
        return;
    }

    await fs.mkdir(prep.outDirAbs, { recursive: true });

    if (!args.force) {
        const existingNormal = await fs.stat(prep.outNormalPath).catch(() => null);
        if (existingNormal) throw new Error(`Refusing to overwrite existing file (use --force): ${prep.outNormalPath}`);

        const existingTemp = await fs.stat(prep.outTempPath).catch(() => null);
        if (existingTemp) throw new Error(`Refusing to overwrite existing file (use --force): ${prep.outTempPath}`);
    }

    await fs.writeFile(prep.outNormalPath, normalTsx, "utf8");
    await fs.writeFile(prep.outTempPath, tempTsx, "utf8");

    // eslint-disable-next-line no-console
    console.log(`Generated 2 component file(s):\n- ${prep.outNormalPath}\n- ${prep.outTempPath}`);
}
