import { atom } from "jotai";
import { notice } from "@renderer/components/ui/local-ui/7-toaster/7-toaster";
import { type WindowInfo } from "./9-types-tmapi";

//#region Window list

export const windowInfosAtom = atom<WindowInfo[]>([]);
export const windowInfosLoadingAtom = atom<boolean>(false);

export const doRefreshWindowInfosAtom = atom(
    null,
    async (_get, set): Promise<void> => {
        set(windowInfosLoadingAtom, true);
        try {
            const json = await tmApi.getTopLevelWindows();
            const data = JSON.parse(json) as WindowInfo[];
            set(windowInfosAtom, data);
        } catch (e) {
            notice.error("Failed to fetch windows");
            console.error("Failed to fetch windows", e);
        } finally {
            set(windowInfosLoadingAtom, false);
        }
    }
);

// Call this on app startup. It guarantees we only fetch the initial window list once,
// even if the React tree mounts twice in dev (StrictMode).
let didRefreshWindowInfosOnAppStart = false;
export const doOnAppStartRefreshWindowInfosAtom = atom(
    null,
    (_get, set): void => {
        if (!didRefreshWindowInfosOnAppStart) {
            didRefreshWindowInfosOnAppStart = true;
            set(doRefreshWindowInfosAtom);
        }
    }
);

//export const activeWindowInfoAtom = atom<WindowInfo | null>(null);
export const activeHwndAtom = atom<string | null>(null);
// Window the user is currently inspecting/selected in the UI.
// This must NOT be overwritten by active-window monitoring, otherwise manual selection "doesn't stick".
export const selectedHwndAtom = atom<string | null>(null);

//#endregion Window list
