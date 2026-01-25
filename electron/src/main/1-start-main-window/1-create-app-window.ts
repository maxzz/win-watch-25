import { appWindow } from "./9-app-window-instance";
import { setAppWindowListeners } from "./3-1-listeners-of-app-window";
import { createTopWindow } from "./1-create-window";

export async function createAppWindow() {
    appWindow.wnd = createTopWindow();
    setAppWindowListeners(appWindow);
}
