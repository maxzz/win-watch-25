// Centralized switches for devtools-related behavior (dev only).
// Keeping this in a small shared module avoids coupling "startup" code to window listeners.

// Whether to install/load the React DevTools extension.
export const loadReactDevtools = true;

// When opening DevTools after the first navigation, React DevTools often needs one reload
// to hook at document start. If true, we trigger a single automatic reload.
export const autoReloadOnceForReactDevtools = true;

