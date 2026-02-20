import { useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { appSettings } from "@renderer/store/1-ui-settings";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, } from "../ui/shadcn/dialog";
import { Label } from "../ui/shadcn/label";
import { Switch } from "../ui/shadcn/switch";
import { setAutoHighlightSelectedControlAtom } from "@renderer/store/2-atoms";

export function DialogOptions({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void; }) {
    const settings = useSnapshot(appSettings);
    const setAutoHighlight = useSetAtom(setAutoHighlightSelectedControlAtom);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Options</DialogTitle>
                    <DialogDescription>
                        App behavior preferences.
                    </DialogDescription>
                </DialogHeader>

                <div className="mt-1 grid gap-2">
                    <div className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
                        <Label htmlFor="opt-auto-highlight" className="flex-1">
                            Auto highlight
                        </Label>
                        <Switch
                            id="opt-auto-highlight"
                            checked={settings.autoHighlightSelectedControl}
                            onCheckedChange={(checked) => setAutoHighlight(checked)}
                        />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

