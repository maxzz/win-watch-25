import { type ComponentType, type HTMLAttributes, type SVGProps } from "react"; // 02.14.26
import { classNames } from "../../classnames";
import { SpyPrintIconsLocationOnce } from "./print-icons-location-once";

type AllIcons = Record<string, ComponentType<SVGProps<SVGSVGElement>>>;

export function SpyTestAllNormalIcons({ allIcons, className, ...rest }: { allIcons: AllIcons; } & HTMLAttributes<HTMLDivElement>) {

    return (
        <div className={classNames("flex flex-wrap gap-2", className)} {...rest}>
            <SpyPrintIconsLocationOnce allIcons={allIcons} />
            
            {Object.entries(allIcons).map(
                ([name, Icon]) => (
                    <div className="flex flex-col items-center" key={name}>
                        <div className="border-sky-500 border rounded" title={name}>
                            <Icon className="size-6" />
                        </div>
                    </div>
                ))
            }
        </div>
    );
}
