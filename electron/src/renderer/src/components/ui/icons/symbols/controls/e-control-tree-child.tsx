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

                  .cls-3 {
                    fill: #b3b3b3;
                  }
            `}</style>
              </defs>
              <g id="Renders">
                <rect className="cls-3" width="24" height="24"/>
                <g id="tree_outline_item" data-name="tree outline item">
                  <path
                      id="to-chilld2" className="cls-1"
                      d="M14.15,19.61h-5.98c-.78,0-1.41-.68-1.41-1.51V7.62"
                  />
                  <line id="to-child1" className="cls-1" x1="7.25" y1="11.25" x2="14.15" y2="11.25"/>
                  <rect id="child2" className="cls-1" x="14.62" y="16.87" width="5.25" height="5.25" rx="1.11" ry="1.11"/>
                  <rect id="child1" className="cls-2" x="14.62" y="8.63" width="5.25" height="5.25" rx="1.11" ry="1.11"/>
                  <rect id="root" className="cls-1" x="4.12" y="1.88" width="5.25" height="5.25" rx="1.11" ry="1.11"/>
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
