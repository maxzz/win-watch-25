import { useAtom, useSetAtom } from "jotai";
import { useSnapshot } from "valtio";
import { appSettings } from "@renderer/store/1-ui-settings";
import { setAutoHighlightSelectedControlAtom } from "@renderer/store/2-atoms";
import { dialogAboutOpenAtom, dialogOptionsOpenAtom } from "@renderer/store/2-ui-atoms";
import { envBuildVersion, envModifiedDate } from "@renderer/utils/env-date-formatter";
import {
    Menubar,
    MenubarContent,
    MenubarItem,
    MenubarMenu,
    MenubarSeparator,
    MenubarTrigger,
} from "../ui/shadcn/menubar";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "../ui/shadcn/dialog";
import { Label } from "../ui/shadcn/label";
import { Switch } from "../ui/shadcn/switch";

export function TopMenu() {
    const [optionsOpen, setOptionsOpen] = useAtom(dialogOptionsOpenAtom);
    const [aboutOpen, setAboutOpen] = useAtom(dialogAboutOpenAtom);

    return (
        <>
            <OptionsDialog open={optionsOpen} onOpenChange={setOptionsOpen} />
            <AboutDialog open={aboutOpen} onOpenChange={setAboutOpen} />

            <Menubar className="p-0 h-auto border-none shadow-none rounded-none bg-transparent">
                <MenubarMenu>
                    <MenubarTrigger className="px-1.5 py-1">Menu</MenubarTrigger>
                    <MenubarContent>
                        <MenubarItem onClick={() => setOptionsOpen(true)}>
                            Options...
                        </MenubarItem>
                        <MenubarItem onClick={() => setAboutOpen(true)}>
                            About
                        </MenubarItem>
                        <MenubarSeparator />
                        <MenubarItem variant="destructive" onClick={() => tmApi.quitApp()}>
                            Exit
                        </MenubarItem>
                    </MenubarContent>
                </MenubarMenu>
            </Menubar>
        </>
    );
}

function OptionsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void; }) {
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

function AboutDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void; }) {
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

