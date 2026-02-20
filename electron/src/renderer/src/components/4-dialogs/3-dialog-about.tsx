import { envBuildVersion, envModifiedDate } from "@renderer/utils/env-date-formatter";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "../ui/shadcn/dialog";

export function DialogAbout({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void; }) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>About</DialogTitle>
                    <DialogDescription>
                        Windows UI Automation Monitor.
                    </DialogDescription>
                </DialogHeader>

                <div className="text-xs grid gap-1">
                    <div className="flex items-center justify-between gap-3">
                        <span className="text-muted-foreground">Version</span>
                        <span className="font-mono">{envBuildVersion()}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                        <span className="text-muted-foreground">Built</span>
                        <span className="font-mono">{envModifiedDate()}</span>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

