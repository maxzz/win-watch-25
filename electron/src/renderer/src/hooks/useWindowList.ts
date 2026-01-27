import { useState, useEffect, useCallback } from 'react';
import { WindowInfo } from '../types';

export function useWindowList() {
    const [windows, setWindows] = useState<WindowInfo[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchWindows = useCallback(
        async () => {
            setLoading(true);
            try {
                const json = await tmApi.getTopLevelWindows();
                const data = JSON.parse(json);
                setWindows(data);
            } catch (e) {
                console.error("Failed to fetch windows", e);
            } finally {
                setLoading(false);
            }
        },
        []);

    useEffect(
        () => {
            fetchWindows();
        },
        [fetchWindows]);

    return { windows, loading, refresh: fetchWindows };
}
