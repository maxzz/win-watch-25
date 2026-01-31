import { SVGAttributes } from "react";
import uiaIconsUrl from "@renderer/assets/uia-icons.png";

export interface UiaFilmstripIconProps extends SVGAttributes<SVGSVGElement> {
    index: number;
    size?: number;
}

/**
 * Renders an icon from the UIA filmstrip.
 * The filmstrip contains 16x16 cells. 
 * This component wraps it in a 24x24 SVG (by default) for consistency.
 */
export function UiaFilmstripIcon({ index, size = 24, className, ...props }: UiaFilmstripIconProps) {
    const cellSize = 16;
    const padding = (size - cellSize) / 2;
    // Assuming the filmstrip has many icons, we don't strictly need the full width 
    // for the SVG mask/viewBox approach, but it helps for clarity.
    const stripWidth = 1184; // 74 icons * 16px

    return (
        <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className={className}
            xmlns="http://www.w3.org/2000/svg"
            {...props}
        >
            <svg
                x={padding}
                y={padding}
                width={cellSize}
                height={cellSize}
                viewBox={`${index * cellSize} 0 ${cellSize} ${cellSize}`}
            >
                <image
                    href={uiaIconsUrl}
                    x="0"
                    y="0"
                    width={stripWidth}
                    height={cellSize}
                    style={{ imageRendering: 'pixelated' }}
                />
            </svg>
        </svg>
    );
}
