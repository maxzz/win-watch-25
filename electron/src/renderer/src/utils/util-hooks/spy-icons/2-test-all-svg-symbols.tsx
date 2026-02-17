import { type HTMLAttributes, useEffect, useState } from "react"; // 02.15.26
import { classNames } from "../../classnames";
import { symbolsFromRawElements, getRawDefs, type SymbolItem, groupSymbolsByPrefix } from "./7-collect-svg-symbols";

export function SpyTestAllSvgSymbols({ fontID = "svgfont", idPrefix, className, ...rest }: { fontID?: string; idPrefix?: string; } & HTMLAttributes<HTMLDivElement>) {

    const [symbols, setSymbols] = useState<SymbolItem[]>([]);

    useEffect(
        () => {
            const raw = getRawDefs(fontID);
            const symbols = symbolsFromRawElements(raw, idPrefix);
            setSymbols(symbols);
        },
        [fontID, idPrefix]
    );

    if (!symbols.length) {
        return null;
    }

    const groups = groupSymbolsByPrefix(symbols, idPrefix);

    const groupEntries = Object
        .entries(groups)
        .map(([prefix, groupSymbols]) => [prefix, groupSymbols.sort((a, b) => a.id.localeCompare(b.id))] as const)
        .sort(([a], [b]) => a.localeCompare(b));

    return (
        <div className={classNames("flex flex-col gap-4", className)} {...rest}>
            {groupEntries.map(
                ([prefix, groupSymbols]) => (
                    <div key={prefix}>
                        {!idPrefix && (
                            <div className="px-2 pb-1 text-xs font-semibold text-muted-foreground">
                                {prefix}
                                
                                <span className="font-normal">
                                    ({groupSymbols.length})
                                </span>
                            </div>
                        )}

                        <div className="grid grid-cols-[repeat(auto-fill,minmax(0,64px))] gap-2">
                            {groupSymbols.map(
                                ({ id, viewBox }) => (
                                    <div key={id}>
                                        <div className="size-16 1bg-[#6c7a6a] border-gray-700 border-4 rounded">
                                            <svg viewBox={viewBox ?? "0 0 24 24"} className="w-full h-full fill-[#deb8f7] stroke-black stroke-[.5]">
                                                <title>{`${id}`}</title>
                                                <use xlinkHref={`#${id}`} />
                                            </svg>
                                        </div>

                                        <div className="min-h-8 text-[.65rem] text-foreground text-center">
                                            {id}
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                )
            )}
        </div>
    );
}
