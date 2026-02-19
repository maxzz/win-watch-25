import { type HTMLAttributes, type SVGAttributes } from "react";
import { classNames } from "@renderer/utils";

export function SvgSymbolControlTreeChild() {
    return (
        <symbol id="control-tree-child" viewBox="0 0 24 24">
              {/* https://icon-sets.iconify.design/?query=tree&search-page=3 ph:tree-view-thin */}
              <defs>
                <style>{`
            .cls-1 {
                    fill: none;
                  }

                  .cls-1, .cls-2 {
                    stroke: #000;
                    stroke-miterlimit: 10;
                  }
            `}</style>
              </defs>
              <g id="Renders">
                <g id="tree_outline_item" data-name="tree outline item">
                  <path
                      className="cls-1" 
                      d="M14.15,19.61h-5.98c-.78,0-1.41-.68-1.41-1.51V7.62"
                  /> {/* to-chilld2 */}
                  <line className="cls-1" x1="7.25" y1="11.25" x2="14.15" y2="11.25"/> {/* to-child1 */}
                  <rect className="cls-1" x="14.62" y="16.87" width="5.25" height="5.25" rx="1.11" ry="1.11"/> {/* child2 */}
                  <rect className="cls-2" x="14.62" y="8.63" width="5.25" height="5.25" rx="1.11" ry="1.11"/> {/* child1 */}
                  <rect className="cls-1" x="4.12" y="1.88" width="5.25" height="5.25" rx="1.11" ry="1.11"/> {/* root */}
                </g>
              </g>
        </symbol>
    );
}

export function SymbolControlTreeChild({ className, title, children, ...rest }: SVGAttributes<SVGSVGElement> & HTMLAttributes<SVGSVGElement>) {
    return (
        <svg className={classNames("fill-none stroke-current", className)} {...rest}>
            {title && <title>{title}</title>}
            {children}
            <use xlinkHref="#control-tree-child" />
        </svg>
    );
}
