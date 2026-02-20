import { useAtom } from "jotai";
import { dialogAboutOpenAtom, dialogOptionsOpenAtom } from "@renderer/store/2-ui-atoms";
import { DialogOptions } from "../4-dialogs/1-dialog-options";
import { DialogAbout } from "../4-dialogs/3-dialog-about";
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
            <DialogAbout open={aboutOpen} onOpenChange={setAboutOpen} />

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
