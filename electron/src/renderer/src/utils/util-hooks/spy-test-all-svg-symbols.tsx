import { type HTMLAttributes, useEffect, useState } from "react";
import { classNames } from "../classnames";

type SymbolItem = {
    id: string;
    viewBox: string | null;
    tagName: string;
};

export function SpyTestAllSvgSymbols({
    fontID = "svgfont",
    idPrefix,
    className,
    ...rest
}: { fontID?: string; idPrefix?: string; } & HTMLAttributes<HTMLDivElement>) {

    const [items, setItems] = useState<SymbolItem[]>([]);

    useEffect(
        () => {
            const defsChildren = document.querySelector(`#${fontID} > defs`)?.children;
            const raw = (defsChildren ? [...defsChildren] : []);

            const next = raw
                .map((el) => {
                    const id = (el as Element).id;
                    if (!id) return null;
                    return {
                        id,
                        viewBox: (el as Element).getAttribute("viewBox"),
                        tagName: (el as Element).tagName.toLowerCase(),
                    } satisfies SymbolItem;
                })
                .filter((v): v is SymbolItem => Boolean(v))
                .filter((v) => (idPrefix ? v.id.startsWith(idPrefix) : true))
                .sort((a, b) => a.id.localeCompare(b.id));

            setItems(next);
        },
        [fontID, idPrefix]
    );

    if (!items.length) {
        return null;
    }

    return (
        <div className={classNames("grid grid-cols-[repeat(auto-fill,minmax(0,64px))] gap-2", className)} {...rest}>
            {items.map(
                ({ id, viewBox }, idx) => (
                    <div key={idx}>
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
                ))
            }
        </div>
    );
}
