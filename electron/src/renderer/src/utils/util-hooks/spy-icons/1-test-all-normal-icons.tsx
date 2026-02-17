import { type ComponentType, type HTMLAttributes, type SVGProps, type ReactNode, useEffect, useRef, useState } from "react"; // 02.16.26
import { classNames } from "../../classnames";
import { AnimatePresence, motion } from "motion/react";
import { Check } from "lucide-react";

type AllIcons = Record<string, ComponentType<SVGProps<SVGSVGElement>>>;

export function SpyTestAllNormalIcons({ allIcons, className, ...rest }: { allIcons: AllIcons; } & HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={classNames("flex flex-wrap gap-2", className)} {...rest}>
            {Object.entries(allIcons).map(
                ([name, Icon]) => (
                    <div className="flex flex-col items-center" key={name}>
                        <CopyToClipboardButton text={name} className="border-sky-500 border rounded" title={name}>
                            <Icon className="size-6" />
                        </CopyToClipboardButton>
                    </div>
                ))
            }
        </div>
    );
}

function CopyToClipboardButton({ text, className, title, children }: { text: string; className?: string; title?: string; children: ReactNode; }) {
    const [copied, setCopied] = useState(false);
    const timeoutIdRef = useRef<number | null>(null);

    useEffect(() => {
        return () => {
            if (timeoutIdRef.current != null) {
                window.clearTimeout(timeoutIdRef.current);
            }
        };
    }, []);

    return (
        <button
            type="button"
            title={title}
            className={classNames("relative overflow-hidden", className)}
            onClick={async () => {
                await copyToClipboard(text);

                setCopied(true);
                if (timeoutIdRef.current != null) {
                    window.clearTimeout(timeoutIdRef.current);
                }
                timeoutIdRef.current = window.setTimeout(() => setCopied(false), 1000);
            }}
        >
            {children}

            <AnimatePresence>
                {copied && (
                    <motion.div
                        key="copied"
                        className="absolute inset-0 grid place-items-center bg-emerald-600/85 text-white"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.98, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                        >
                            <Check className="size-5" />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </button>
    );
}

async function copyToClipboard(text: string) {
    // Modern async clipboard APIs (works with a user gesture like onClick)
    try {
        await navigator.clipboard.writeText(text);
        return;
    } catch {
        // fall through
    }

    // Fallback: write() with ClipboardItem (still modern, but not always supported)
    try {
        if (typeof ClipboardItem !== "undefined" && navigator.clipboard.write) {
            const blob = new Blob([text], { type: "text/plain" });
            await navigator.clipboard.write([new ClipboardItem({ "text/plain": blob })]);
        }
    } catch {
        // If clipboard is blocked/unavailable, silently ignore (debug-only UX helper).
    }
}
