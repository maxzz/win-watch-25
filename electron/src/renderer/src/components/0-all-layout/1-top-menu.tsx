import { useAtom } from "jotai";
import { dialogAboutOpenAtom, dialogOptionsOpenAtom } from "@renderer/store/2-ui-atoms";
import { envBuildVersion, envModifiedDate } from "@renderer/utils/env-date-formatter";
import { DialogOptions } from "../4-dialogs/1-dialog-options";
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

export function TopMenu() {
    const [optionsOpen, setOptionsOpen] = useAtom(dialogOptionsOpenAtom);
    const [aboutOpen, setAboutOpen] = useAtom(dialogAboutOpenAtom);

    return (
        <>
            <DialogOptions open={optionsOpen} onOpenChange={setOptionsOpen} />
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

