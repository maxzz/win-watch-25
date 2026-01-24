---
name: ""
overview: ""
todos: []
isProject: false
---

# Build, Run, and Debug Instructions

This document provides detailed steps to build, run, and debug the Windows UI Automation Monitor application.

## 1. Native Windows DLL (`native/`)

This component interacts directly with the OS via Microsoft UI Automation API.

### Build

1.  Open `native/WindowMonitor.sln` in **Visual Studio 2022**.
2.  Select **Release** configuration and **x64** platform from the top toolbar.
3.  Right-click the `WindowMonitor` project in Solution Explorer and select **Build**.
4.  **Verify Output**: Ensure that `native/x64/Release/WindowMonitor.dll` and `WindowMonitor.lib` are generated.

### Debug

1.  Open `native/WindowMonitor.sln`.
2.  Right-click project > Properties > Debugging.
3.  Set **Command** to your Electron executable path.

  - Example: `C:\y\w\2-web\0-dp\win-watch-25\electron\node_modules\electron\dist\electron.exe`

4.  Set **Command Arguments** to the path of your electron main script.

  - Example: `.` (if running from electron folder) or `src/main/index.js`

5.  Set breakpoints in `WindowMonitor.cpp`.
6.  Press F5 to start debugging.

  - *Note*: Debugging mixed native/node environments can be complex. Attaching to the running `electron.exe` process (Main process) is often easier.

## 2. NAPI Plugin (`napi-plugin/`)

This component bridges Node.js/Electron with the native DLL.

### Prerequisites

- Ensure the **Native Windows DLL** is built first (it requires `WindowMonitor.lib`).
- Ensure `node-gyp` dependencies are installed (Python, Visual Studio Build Tools).

### Build

1.  Open a terminal in the `napi-plugin/` directory.
2.  Run `npm install`.

  - **Critical**: This installs `node-addon-api`. If this step is skipped, you will see errors about missing includes like `<napi.h>`.

3.  Run `npm run install` (or `node-gyp rebuild`).
4.  **Verify Output**: Check for `napi-plugin/build/Release/winwatch.node`.

### Troubleshooting Missing Includes

- **Error**: `fatal error C1083: Cannot open include file: 'napi.h': No such file or directory`
- **Fix**: Run `npm install` in `napi-plugin/`. Check `node_modules/node-addon-api` exists.
- **Error**: `fatal error C1083: Cannot open include file: 'WindowMonitor.h': No such file or directory`
- **Fix**: Check `binding.gyp`. The `include_dirs` should point to `../native/src`.

## 3. Electron Application (`electron/`)

The frontend user interface.

### Build & Run

1.  Open a terminal in the `electron/` directory.
2.  Run `npm install`.
3.  **Critical Step**: Copy the `native/x64/Release/WindowMonitor.dll` file to the `electron/` root folder.

  - The application looks for the DLL in the same directory as the executable or in the system PATH.

4.  Run `npm run dev` to start the application.

### Debug

- **Renderer Process** (React UI):
- Press `Ctrl+Shift+I` (or `Cmd+Option+I`) inside the application window to open Chrome DevTools.
- You can inspect elements, console logs, and network requests here.
- **Main Process** (Node.js/Electron):
- Use VS Code's "JavaScript Debug Terminal" to run `npm run dev`.
- Or run with `--inspect` flag and attach a debugger.

## Integrated Workflow Summary

1.  **Build Native**: VS 2022 -> Build Solution (Release/x64).
2.  **Build Plugin**: `cd napi-plugin && npm install && npm run install`.
3.  **Prepare Electron**: `cd electron && npm install`.
4.  **Copy DLL**: `copy ..\native\x64\Release\WindowMonitor.dll .`
5.  **Run**: `npm run dev`.

## Common Errors

- **"Module not found: ... winwatch.node"**
- The path in `electron/src/main/index.ts` determines where Electron looks for the `.node` file.
- It tries to load from `../../../../napi-plugin/build/Release/winwatch.node`. Ensure this path is valid relative to the built `index.js`.
- **"The specified module could not be found"** (Runtime error when loading `.node`)
- This usually means a *dependency* of the `.node` file is missing.
- In this case, `WindowMonitor.dll` is missing. Ensure it is in the `electron/` root or system PATH.