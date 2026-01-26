# Build Plugins Script

This script builds the native Windows DLL and NAPI plugin, then copies them to `dist-electron/plugins/` for the Electron app to load.

## Prerequisites

1. **Visual Studio** with C++ desktop development workload installed
2. **MSBuild** available in PATH (typically via VS Developer Command Prompt)
3. **Node.js** with node-gyp configured
4. **Python** (required by node-gyp)

## Usage

```bash
# Build both native DLL and NAPI plugin (Release)
pnpm build:plugins

# Build both native DLL and NAPI plugin (Debug)
pnpm build:plugins:debug

# Build only native DLL (Release)
pnpm build:native

# Build only native DLL (Debug)
pnpm build:native:debug

# Build only NAPI plugin (Release)
pnpm build:napi

# Build only NAPI plugin (Debug)
pnpm build:napi:debug
```

Or run directly with tsx:

```bash
npx tsx scripts/build-plugins.ts [options]
```

## Options

| Option | Description |
|--------|-------------|
| `--debug` | Build debug configuration |
| `--release` | Build release configuration (default) |
| `--native-only` | Only build the native DLL, skip NAPI plugin |
| `--napi-only` | Only build the NAPI plugin, skip native DLL |

## Build Order

The script performs these steps in order:

1. **Build native project** (`native/WindowMonitor.vcxproj`)
   - Uses MSBuild to compile the C++ DLL
   - Output: `native/x64/{Debug|Release}/WindowMonitor.dll`

2. **Build NAPI plugin** (`napi-plugin/`)
   - Uses node-gyp to compile the Node.js addon
   - Links against `WindowMonitor.lib`
   - Output: `napi-plugin/build/{Debug|Release}/winwatch.node`

3. **Copy files** to `dist-electron/plugins/`
   - `WindowMonitor.dll` - The native Windows DLL
   - `winwatch.node` - The Node.js native addon

## Output Structure

```
dist-electron/
└── plugins/
    ├── WindowMonitor.dll   # Native Windows DLL
    └── winwatch.node       # Node.js native addon
```

## Troubleshooting

### MSBuild not found

Make sure to run from a Visual Studio Developer Command Prompt, or add MSBuild to your PATH:

```powershell
# Add VS2022 MSBuild to PATH (adjust path as needed)
$env:PATH += ";C:\Program Files\Microsoft Visual Studio\2022\Community\MSBuild\Current\Bin"
```

### node-gyp errors

Ensure you have the required build tools:

```bash
npm install -g node-gyp
```

On Windows, you may also need:
```bash
npm install -g windows-build-tools
```

### DLL not found at runtime

The `winwatch.node` addon loads `WindowMonitor.dll` at runtime. Both files must be in the same directory (`dist-electron/plugins/`).
