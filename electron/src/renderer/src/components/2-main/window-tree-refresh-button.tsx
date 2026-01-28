import { useSetAtom } from "jotai";
import { doRefreshWindowInfosAtom } from "@renderer/store/2-atoms";

export function WindowTreeRefreshButton() {
    const refreshWindowInfos = useSetAtom(doRefreshWindowInfosAtom);

    return (
        <button onClick={refreshWindowInfos} className="px-2 py-1 text-xs text-primary-foreground bg-primary rounded hover:bg-primary/90">
            Refresh
        </button>
    );
}
