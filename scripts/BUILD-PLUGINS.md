# Build Plugins Script

This script builds the native Windows DLL and NAPI plugin, then copies them to `dist-electron/plugins/` for the Electron app to load.

## Prerequisites

1. **Visual Studio 2022/2026** with "Desktop development with C++" workload installed
2. **Node.js** with node-gyp configured
3. **Python** (required by node-gyp)

The script automatically finds MSBuild using `vswhere.exe` (installed with Visual Studio), so you don't need to run from a Developer Command Prompt.

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

1. **Find MSBuild** using `vswhere.exe`
   - Automatically locates Visual Studio installation
   - Finds MSBuild.exe in the VS installation directory

2. **Build native project** (`native/WindowMonitor.vcxproj`)
   - Uses MSBuild to compile the C++ DLL
   - Output: `native/x64/{Debug|Release}/WindowMonitor.dll`

3. **Build NAPI plugin** (`napi-plugin/`)
   - Uses node-gyp to compile the Node.js addon
   - Links against `WindowMonitor.lib`
   - Output: `napi-plugin/build/{Debug|Release}/winwatch.node`

4. **Copy files** to `dist-electron/plugins/`
   - `WindowMonitor.dll` - The native Windows DLL
   - `winwatch.node` - The Node.js native addon

## Output Structure

```
dist-electron/
└── plugins/
    ├── WindowMonitor.dll   # Native Windows DLL
    └── winwatch.node       # Node.js native addon
```

## How MSBuild is Found

The script uses `vswhere.exe` to automatically locate Visual Studio:

1. `vswhere.exe` is located at:
   ```
   C:\Program Files (x86)\Microsoft Visual Studio\Installer\vswhere.exe
   ```

2. The script queries vswhere for the latest VS installation with MSBuild:
   ```
   vswhere -latest -requires Microsoft.Component.MSBuild -property installationPath
   vswhere -latest -requires Microsoft.Component.MSBuild -property installationVersion
   ```

3. MSBuild is then found at:
   ```
   {VS_INSTALL_PATH}\MSBuild\Current\Bin\MSBuild.exe
   ```

## Platform Toolset Auto-Detection

The script automatically detects and uses the correct Platform Toolset based on your Visual Studio version:

| VS Version | Major Version | Platform Toolset |
|------------|---------------|------------------|
| VS 2017    | 15.x          | v141             |
| VS 2019    | 16.x          | v142             |
| VS 2022    | 17.x          | v143             |
| VS 2026    | 18.x          | v144             |

This means you don't need to manually update the `.vcxproj` file when switching between Visual Studio versions - the build script handles it automatically by passing `/p:PlatformToolset=vXXX` to MSBuild.

## Troubleshooting

### "vswhere.exe not found"

Make sure Visual Studio is installed. The Visual Studio Installer creates `vswhere.exe`.

### "No Visual Studio installation with MSBuild found"

Install the "Desktop development with C++" workload in Visual Studio Installer:

1. Open Visual Studio Installer
2. Click "Modify" on your VS installation
3. Check "Desktop development with C++"
4. Click "Modify" to install

### node-gyp errors

Ensure you have the required build tools:

```bash
npm install -g node-gyp
```

### DLL not found at runtime

The `winwatch.node` addon loads `WindowMonitor.dll` at runtime. Both files must be in the same directory (`dist-electron/plugins/`).

### Manual MSBuild Path (Alternative)

If automatic detection fails, you can run the script from a **Developer Command Prompt for VS 2026**:

1. Open Start Menu
2. Search for "Developer Command Prompt for VS 2026"
3. Navigate to your project directory
4. Run `pnpm build:plugins`

Or add MSBuild to your PATH manually:

```powershell
$env:PATH += ";C:\Program Files\Microsoft Visual Studio\2026\Community\MSBuild\Current\Bin"
```
