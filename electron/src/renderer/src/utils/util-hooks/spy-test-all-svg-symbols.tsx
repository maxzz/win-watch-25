import { type HTMLAttributes, useEffect, useState } from "react";
import { classNames } from "../classnames";

type SymbolItem = {
    id: string;
    viewBox: string | null;
    tagName: string;
};

export function SpyTestAllSvgSymbols({ fontID = "svgfont", idPrefix, className, ...rest }: { fontID?: string; idPrefix?: string; } & HTMLAttributes<HTMLDivElement>) {

    const [items, setItems] = useState<SymbolItem[]>([]);

    useEffect(
        () => {
            const defsChildren = document.querySelector(`#${fontID} > defs`)?.children;
            const raw = (defsChildren ? [...defsChildren] : []);
            const next = getNextFromRaw(raw, idPrefix);
            setItems(next);
        },
        [fontID, idPrefix]
    );

    if (!items.length) {
        return null;
    }

    const groups = groupItemsByPrefix(items, idPrefix);

    const groupEntries = Object
        .entries(groups)
        .map(([prefix, groupItems]) => [prefix, groupItems.sort((a, b) => a.id.localeCompare(b.id))] as const)
        .sort(([a], [b]) => a.localeCompare(b));

    return (
        <div className={classNames("flex flex-col gap-4", className)} {...rest}>
            {groupEntries.map(
                ([prefix, groupItems]) => (
                    <div key={prefix}>
                        {!idPrefix && (
                            <div className="px-2 pb-1 text-xs font-semibold text-muted-foreground">
                                {prefix} <span className="font-normal">({groupItems.length})</span>
                            </div>
                        )}

                        <div className="grid grid-cols-[repeat(auto-fill,minmax(0,64px))] gap-2">
                            {groupItems.map(({ id, viewBox }) => (
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
                            ))}
                        </div>
                    </div>
                )
            )}
        </div>
    );
}

function getNextFromRaw(raw: Element[], idPrefix?: string): SymbolItem[] {
    return raw
        .map((el) => {
            const id = el.id;
            if (!id) return null;
            return {
                id,
                viewBox: el.getAttribute("viewBox"),
                tagName: el.tagName.toLowerCase(),
            } satisfies SymbolItem;
        })
        .filter((v): v is SymbolItem => Boolean(v))
        .filter((v) => (idPrefix ? v.id.startsWith(idPrefix) : true))
        .sort((a, b) => a.id.localeCompare(b.id));
}

function groupItemsByPrefix(items: SymbolItem[], idPrefix?: string): Record<string, SymbolItem[]> {
    return items.reduce(
        (acc, item) => {
            const key = idPrefix ? idPrefix : getIdPrefixBucket(item.id);
            (acc[key] ??= []).push(item);
            return acc;
        },
        {} as Record<string, SymbolItem[]>
    );
}

function getIdPrefixBucket(id: string) {
    const idx = id.indexOf("-");
    return idx > 0 ? id.slice(0, idx) : "(no-prefix)";
}
