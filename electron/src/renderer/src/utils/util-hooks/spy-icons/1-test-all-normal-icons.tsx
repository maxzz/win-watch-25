import { type ComponentType, type HTMLAttributes, type SVGProps } from "react"; // 02.16.26
import { classNames } from "../../classnames";

type AllIcons = Record<string, ComponentType<SVGProps<SVGSVGElement>>>;

export function SpyTestAllNormalIcons({ allIcons, className, ...rest }: { allIcons: AllIcons; } & HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={classNames("flex flex-wrap gap-2", className)} {...rest}>
            {Object.entries(allIcons).map(
                ([name, Icon]) => (
                    <div className="flex flex-col items-center" key={name}>
                        <button className="border-sky-500 border rounded" type="button" onClick={() => copyToClipboard(name)} title={name}>
                            <Icon className="size-6" />
                        </button>
                    </div>
                ))
            }
        </div>
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
