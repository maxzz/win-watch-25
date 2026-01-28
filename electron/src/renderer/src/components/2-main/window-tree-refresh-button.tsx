import { useAtom } from "jotai";
import { windowInfosAtom, windowInfosLoadingAtom } from "@renderer/store/2-active-window";

export function WindowTreeRefreshButton() {
    const [, setWindowInfos] = useAtom(windowInfosAtom);
    const [, setWindowInfosLoading] = useAtom(windowInfosLoadingAtom);

    const handleRefresh = async () => {
        setWindowInfosLoading(true);
        try {
            const json = await tmApi.getTopLevelWindows();
            const data = JSON.parse(json);
            setWindowInfos(data);
        } catch (e) {
            console.error("Failed to fetch windows", e);
        } finally {
            setWindowInfosLoading(false);
        }
    };

    return (
        <button onClick={handleRefresh} className="px-2 py-1 text-xs text-primary-foreground bg-primary rounded hover:bg-primary/90">
            Refresh
        </button>
    );
}
