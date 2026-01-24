# Windows UI Automation Monitor

A three-part application to monitor active windows and inspect their controls using Microsoft UI Automation API.

## Project Structure

- `native/`: Native C++ DLL utilizing Microsoft UI Automation API.
- `napi-plugin/`: Node.js Addon (NAPI) wrapping the native DLL.
- `electron/`: Electron application with React frontend.

## Build Instructions

### Prerequisites

- Visual Studio 2022 (with C++ desktop development workload)
- Node.js & npm
- Python (for node-gyp)

### 1. Build Native DLL

1. Open `native/WindowMonitor.sln` in Visual Studio.
2. Select `Release` configuration and `x64` platform.
3. Build the solution.
4. Ensure `native/x64/Release/WindowMonitor.lib` and `WindowMonitor.dll` are generated.

### 2. Build NAPI Plugin

1. Navigate to `napi-plugin/` directory.
2. Run `npm install` to install dependencies.
3. Run `npm run rebuild` or `node-gyp rebuild`.
4. This will generate `napi-plugin/build/Release/winwatch.node`.

### 3. Run Electron App

1. Navigate to `electron/` directory.
2. Run `npm install` to install dependencies.
3. Copy `native/x64/Release/WindowMonitor.dll` to `electron/` (or ensure it's in your PATH).
4. Run `npm run dev` to start the application in development mode.

## Troubleshooting

- If `winwatch.node` fails to load, make sure `WindowMonitor.dll` can be found (copy it next to the executable or add its folder to PATH).
- If NAPI build fails, check if `WindowMonitor.lib` path in `binding.gyp` is correct.
