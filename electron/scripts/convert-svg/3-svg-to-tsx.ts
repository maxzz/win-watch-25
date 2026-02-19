export function generateSymbolAndWrapperComponents(params: {
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

export function generateIconComponent(params: { iconComponentName: string; viewBox: string; innerJsx: string }) {
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
