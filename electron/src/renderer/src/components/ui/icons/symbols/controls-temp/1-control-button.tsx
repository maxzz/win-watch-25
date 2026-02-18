import { type HTMLAttributes } from "react";
import { classNames } from "@renderer/utils";

export function IconControlButton({ className, title, ...rest }: HTMLAttributes<SVGSVGElement>) {
    return (
        <svg className={classNames("fill-none stroke-current", className)} viewBox="0 0 24 24" {...rest}>
            {title && <title>{title}</title>}
            {/* highlight */}
            <path
                d="M21.23,10.2v4.61c0,1.59-1.18,2.88-2.63,2.88H6.43"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeMiterlimit="10"
                opacity="0.35"
            />
            {/* body */}
            <rect
                x="2.77"
                y="6.31"
                width="17.43"
                height="10.37"
                rx="2.63"
                ry="2.63"
                fill="currentColor"
                opacity="0.12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeMiterlimit="10"
            />
        </svg>
    );
}
