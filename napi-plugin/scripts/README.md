# Scripts

## `update-clangd.mjs`

Generates `napi-plugin/.clangd` with include paths needed by clangd/IntelliSense.

This script is for editor diagnostics only. It does **not** affect `node-gyp` builds.

### What it adds

- C++ standard flag: `-std=c++17`
- `node-addon-api` include directory
- `native/src` include directory
- Node headers from `%LOCALAPPDATA%/node-gyp/Cache/<version>/include/node` (Windows)
- `-DNAPI_DISABLE_CPP_EXCEPTIONS`

### Path modes

The script supports include-path output in either:

- `absolute` (default)
- `relative`

This controls how `node-addon-api` and `native/src` include paths are written in `.clangd`.

Node-gyp cache include paths remain absolute.

### Options

- `--absolute`
  - Force absolute include paths.
- `--relative`
  - Force relative include paths.
- `--path-mode=absolute|relative`
  - Equivalent explicit form.

### Environment variable

- `CLANGD_INCLUDE_PATH_MODE=absolute|relative`
  - Used when no CLI path-mode option is provided.

Priority order:

1. CLI option (`--absolute`, `--relative`, `--path-mode=...`)
2. `CLANGD_INCLUDE_PATH_MODE`
3. default: `absolute`

### Examples

From `napi-plugin/`:

```bash
node scripts/update-clangd.mjs
```

```bash
node scripts/update-clangd.mjs --absolute
```

```bash
node scripts/update-clangd.mjs --relative
```

```bash
node scripts/update-clangd.mjs --path-mode=relative
```

PowerShell with environment variable:

```powershell
$env:CLANGD_INCLUDE_PATH_MODE = "relative"
node scripts/update-clangd.mjs
```

### Notes

- The script resolves `node-addon-api` using Node module resolution (from `napi-plugin`), so absolute mode works with npm/pnpm layouts.
- If IntelliSense still shows stale errors after regeneration, reload the editor window or restart clangd.
