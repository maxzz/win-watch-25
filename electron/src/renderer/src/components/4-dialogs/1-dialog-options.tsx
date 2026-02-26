import { useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { classNames } from "@renderer/utils/classnames";
import { appSettings } from "@renderer/store/1-ui-settings";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, } from "../ui/shadcn/dialog";
import { Label } from "../ui/shadcn/label";
import { Switch } from "../ui/shadcn/switch";
import { setAutoHighlightSelectedControlAtom, setShowEmptyBoundsNotificationAtom } from "@renderer/store/2-2-atoms-controls-list";

export function DialogOptions({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void; }) {
    const settings = useSnapshot(appSettings);
    const setAutoHighlight = useSetAtom(setAutoHighlightSelectedControlAtom);
    const setShowEmptyBoundsNotification = useSetAtom(setShowEmptyBoundsNotificationAtom);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[360px]!">

                <DialogHeader>
                    <DialogTitle>
                        Options
                    </DialogTitle>
                    <DialogDescription>
                        App behavior preferences.
                    </DialogDescription>
                </DialogHeader>

                <div className="mt-1 pb-4 grid gap-2">
                    <OptionCheckbox
                        checked={settings.autoHighlightSelectedControl}
                        onCheckedChange={(checked) => setAutoHighlight(checked)}
                        label="Auto highlight"
                        title="Auto highlight the selected control"
                    />
                    <OptionCheckbox
                        checked={settings.showEmptyBoundsNotification}
                        onCheckedChange={(checked) => setShowEmptyBoundsNotification(checked)}
                        label="Show empty bounds notification"
                        title="Show a notification when selected control bounds are empty"
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}

function OptionCheckbox({ checked, onCheckedChange, label, disabled, title }: { checked: boolean, onCheckedChange: (checked: boolean) => void, label: React.ReactNode, disabled?: boolean; title?: string; }) {
    return (
        <Label
            className={classNames("text-xs font-normal flex items-center justify-between space-x-1", disabled && "opacity-50")}
            data-disabled={disabled}
            title={title}
        >
            {label}
            <Switch className={classNames(disabled && "disabled:opacity-100")} checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
        </Label>
    );
}
