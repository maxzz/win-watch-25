import { type HTMLAttributes } from "react";
import { classNames } from "@renderer/utils";

export function IconScrollbar({ className, title, ...rest }: HTMLAttributes<SVGSVGElement>) {
    return (
        <svg className={classNames("fill-none stroke-current", className)} viewBox="0 0 24 24" {...rest}>
            {title && <title>{title}</title>}
              <defs>
                <style>{`
            .cls-1, .cls-2 {
                    fill: none;
                    stroke: #999;
                    stroke-miterlimit: 10;
                  }

                  .cls-2 {
                    stroke-width: 1.5px;
                  }

                  .cls-3 {
                    fill: #b3b3b3;
                  }
            `}</style>
              </defs>
              <g id="Renders">
                <rect className="cls-3" width="24" height="24"/>
                <g id="scrollbar">
                  <rect className="cls-2" x="2.39" y="7.38" width="19.21" height="9.24" rx="1.62" ry="1.62"/>
                  <path
                      d="M4.33,12.48l2.59,1.5c.37.21.83-.05.83-.48v-3c0-.43-.46-.69-.83-.48l-2.59,1.5c-.37.21-.37.75,0,.96Z"
                  />
                  <path
                      d="M19.55,11.52l-2.59-1.5c-.37-.21-.83.05-.83.48v3c0,.43.46.69.83.48l2.59-1.5c.37-.21.37-.75,0-.96Z"
                  />
                  <line className="cls-1" x1="9.58" y1="7.38" x2="9.58" y2="16.62"/>
                  <line className="cls-1" x1="14.35" y1="7.38" x2="14.35" y2="16.62"/>
                </g>
              </g>
        </svg>
    );
}
