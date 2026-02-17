import { type ReactNode, useState } from "react"; // 02.14.26
import { SpyTestAllNormalIcons } from "./1-test-all-normal-icons";
import { SpyTestAllSvgSymbols } from "./2-test-all-svg-symbols";
import * as allIcons from "@renderer/components/ui/icons/normal";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { SpyPrintIconsLocationOnce } from "./8-print-icons-location-once";

export function SpyAllIcons({ includeSvgSymbols }: { includeSvgSymbols?: boolean; }) {
    return (
        <IconsAndSymbolsAccordion>
            <SpyPrintIconsLocationOnce allIcons={allIcons} />
            
            <div className="m-2 bg-sky-50/70 border-sky-500 border rounded shadow-sm">

                <div className="px-2 mt-1 text-sm font-semibold">Normal icons</div>
                <SpyTestAllNormalIcons className="mx-auto px-2 py-2" allIcons={allIcons} />

                {includeSvgSymbols && <>
                    <div className="mt-4 px-2 text-sm font-semibold">SVG symbols (controls)</div>
                    <SpyTestAllSvgSymbols className="mx-auto px-2 pt-2" idPrefix="control-" />

                    {/* <div className="mt-4 px-2 text-sm font-semibold">SVG symbols (all)</div>
                    <SpyTestAllSvgSymbols className="mx-auto px-2 pt-2" /> */}
                </>}
            </div>
        </IconsAndSymbolsAccordion>
    );
}

function IconsAndSymbolsAccordion({ children }: { children: ReactNode; }) {
    const [open, setOpen] = useState(false);

    return (
        <div className="m-2 rounded border bg-card/30 shadow-sm overflow-y-auto">
            <button
                type="button"
                className="w-full px-2 py-1 text-left border-b bg-muted/20 flex items-center select-none"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
            >
                <span className="text-xs font-semibold">
                    Icons and symbols
                </span>
                <motion.span
                    className="ml-auto text-muted-foreground inline-flex items-center justify-center"
                    animate={{ rotate: open ? 180 : 0 }}
                    transition={{ duration: 0.15 }}
                >
                    <ChevronDown className="size-4" />
                </motion.span>
            </button>

            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
