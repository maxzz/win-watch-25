import { useEffect, useCallback } from 'react';
import { useAtom } from 'jotai';
import { windowInfosAtom, windowInfosLoadingAtom } from '../2-active-window';

export function useWindowList() {
    const [windowInfos, setWindowInfos] = useAtom(windowInfosAtom);
    const [windowInfosLoading, setWindowInfosLoading] = useAtom(windowInfosLoadingAtom);

    const fetchWindows = useCallback(
        async () => {
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
        },
        [setWindowInfos, setWindowInfosLoading]);

    useEffect(
        () => {
            fetchWindows();
        },
        [fetchWindows]);

    return { windows: windowInfos, windowInfosLoading, refresh: fetchWindows };
}
