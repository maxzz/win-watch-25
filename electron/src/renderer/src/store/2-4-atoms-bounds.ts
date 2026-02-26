import { appSettings } from "./1-ui-settings";
import { notice } from "@renderer/components/ui/local-ui/7-toaster/7-toaster";
import { type ControlNode, type NativeBounds } from "./9-tmapi-types";

export async function getCurrentHighlightBounds(selectedHandle: string | null, control: ControlNode): Promise<NativeBounds | null> {
    const initialBounds = control.bounds;
    if (!initialBounds) {
        notice.info("Selected control has no bounds to highlight.");
        return null;
    }
    if (isBoundsEmpty(initialBounds)) {
        if (appSettings.showEmptyBoundsNotification) {
            notice.info("Selected control bounds are empty.");
        }
        return null;
    }
    if (!selectedHandle || !control.runtimeId) {
        return initialBounds;
    }

    const rectJson = await tmApi.getControlCurrentBounds(selectedHandle, control.runtimeId);
    const currentBounds = JSON.parse(rectJson) as NativeBounds | null;

    if (!currentBounds) {
        notice.info("Selected control has no current on-screen bounds.");
        return null;
    }
    if (isBoundsEmpty(currentBounds)) {
        if (appSettings.showEmptyBoundsNotification) {
            notice.info("Selected control current bounds are empty.");
        }
        return null;
    }

    return currentBounds;
}

function isBoundsEmpty(bounds: NativeBounds): boolean {
    return bounds.right <= bounds.left || bounds.bottom <= bounds.top;
}
