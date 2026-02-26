import { useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { classNames } from "@renderer/utils/classnames";
import { appSettings } from "@renderer/store/1-ui-settings";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, } from "../ui/shadcn/dialog";
import { Label } from "../ui/shadcn/label";
import { Switch } from "../ui/shadcn/switch";
import { setAutoHighlightSelectedControlAtom, setShowEmptyBoundsNotificationAtom } from "@renderer/store/2-2-atoms-controls-list";
import { setHighlightBlinkCountAtom } from "@renderer/store/2-3-atoms-highlight";

export function DialogOptions({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void; }) {
    const settings = useSnapshot(appSettings);
    const setAutoHighlight = useSetAtom(setAutoHighlightSelectedControlAtom);
    const setHighlightBlinkCount = useSetAtom(setHighlightBlinkCountAtom);
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
                    <OptionNumber
                        value={settings.highlightBlinkCount}
                        onValueChange={setHighlightBlinkCount}
                        label="Highlight blink count"
                        title="Blink count used for control/window highlight (1-10)"
                        min={1}
                        max={10}
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

function OptionNumber({ value, onValueChange, label, disabled, title, min, max }: { value: number; onValueChange: (value: number) => void; label: React.ReactNode; disabled?: boolean; title?: string; min: number; max: number; }) {
    return (
        <Label
            className={classNames("text-xs font-normal flex items-center justify-between space-x-2", disabled && "opacity-50")}
            data-disabled={disabled}
            title={title}
        >
            {label}
            <input
                className="h-7 w-16 rounded border border-input bg-background px-2 py-1 text-right text-xs"
                type="number"
                value={value}
                min={min}
                max={max}
                step={1}
                disabled={disabled}
                onChange={(e) => {
                    const next = Number(e.target.value);
                    if (!Number.isFinite(next)) return;
                    onValueChange(next);
                }}
            />
        </Label>
    );
}
