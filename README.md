# Windows UI Automation Monitor

A three-part application to monitor active windows and inspect their controls using Microsoft UI Automation API.

## Project Structure

- `native/` - Native C++ DLL using Microsoft UI Automation API
- `napi-plugin/` - Node.js Addon (NAPI) wrapping the native DLL
- `electron/` - Electron application with React frontend

## Build Order (IMPORTANT)

**You must build in this exact order:**

### Step 1: Build Native DLL

1. Open `native/WindowMonitor.sln` in **Visual Studio 2022**
2. Select **Release** configuration and **x64** platform
3. Build the solution (Ctrl+Shift+B)
4. Verify `native/x64/Release/WindowMonitor.dll` and `WindowMonitor.lib` exist

### Step 2: Build NAPI Plugin

```bash
cd napi-plugin
pnpm install
pnpm run build
```

Verify `napi-plugin/build/Release/winwatch.node` exists.

### Step 3: Run Electron App

```bash
cd electron
pnpm install
```

Copy the DLL to electron folder:
```bash
copy ..\native\x64\Release\WindowMonitor.dll .
```

Start the app:
```bash
pnpm run dev
```

## Troubleshooting

### Error: `LNK1181: cannot open input file 'WindowMonitor.lib'`
- **Cause**: Native DLL not built yet
- **Fix**: Build the native project in Visual Studio first (Step 1)

### Error: `The specified module could not be found`
- **Cause**: `WindowMonitor.dll` is missing
- **Fix**: Copy `native/x64/Release/WindowMonitor.dll` to the `electron/` folder

### Error: `Cannot find module 'winwatch.node'`
- **Cause**: NAPI plugin not built
- **Fix**: Run `pnpm run build` in `napi-plugin/` (Step 2)

## Development

From the root directory:
```bash
# Build NAPI plugin
pnpm run build:napi

# Copy DLL to electron
pnpm run copy:dll

# Run electron app
pnpm run dev
```

## Debugging

### Debug Native Code (Visual Studio)
1. Open `native/WindowMonitor.sln`
2. Set breakpoints
3. Debug > Attach to Process > select `electron.exe`

### Debug Electron Main Process
```bash
cd electron
pnpm run dev:debug
```
Then attach VS Code debugger to Node.js process.

### Debug Renderer (React)
Press `Ctrl+Shift+I` in the app window to open DevTools.
