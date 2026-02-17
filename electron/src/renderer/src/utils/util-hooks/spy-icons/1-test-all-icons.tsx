import { type ComponentType, type HTMLAttributes, type SVGProps, useEffect } from "react"; // 02.14.26
import { classNames } from "../../classnames";

type AllIcons = Record<string, ComponentType<SVGProps<SVGSVGElement>>>;

const PRINT_ONCE_KEY = "__win_watch_25_spy_test_all_icons_printed__";

export function SpyTestAllIcons({ allIcons, className, ...rest }: { allIcons: AllIcons; } & HTMLAttributes<HTMLDivElement>) {
    
    useEffect(() => {
        // In React 18 dev + StrictMode, effects run twice (mount/unmount/mount) to detect unsafe side effects.
        // Use a dev-only global guard so this prints exactly once in debug builds.
        if (!import.meta.env.DEV) return;

        const g = globalThis as typeof globalThis & Record<string, unknown>;
        if (g[PRINT_ONCE_KEY]) return;
        g[PRINT_ONCE_KEY] = true;

        printIconsLocation(allIcons);
    }, [allIcons]);

    return (
        <div className={classNames("flex flex-wrap gap-2", className)} {...rest}>
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

//printIconsLocation(allIcons);

function printIconsLocation(allIcons: AllIcons) {
    // G: 'js get function location'
    // https://stackoverflow.com/questions/41146373/access-function-location-programmatically 'Access function location programmatically'
    // https://chromedevtools.github.io/devtools-protocol/tot/Runtime/#method-getProperties 'Runtime.getProperties'
    // console.log(Runtime.getProperties(allIcons).map(({ name }) => name));

    // * icons sorted in alphabetical order
    // * can we use import.meta.url from bundler? https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import.meta
    //   but it should be exposed from each file which is too much for this task
    // * or we can use plugin at build time to access file location, but that will be too much for this task

    const msg = 'Each icon has [[FunctionLocation]] property, but it is accessible from trace only (i.e. devtools-protocol), not from code.';
    const entries = Object.keys(allIcons);

    const text = entries.map((name, idx) => ` ${`${idx}`.padStart(3, ' ')}: ${name}`).join('\n');

    console.groupCollapsed('Icons');    
    console.log(`%c${msg}\n%c${text}`, 'font-size: 0.65rem; color: darkblue;', 'font-size: 0.55rem; color: darkgreen;');
    console.groupEnd();
}
