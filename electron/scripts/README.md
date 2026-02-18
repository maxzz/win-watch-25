## Electron scripts

### Generate “normal icon” components from SVG `<symbol>` files

This is a dev utility that reads a folder of TSX files containing `<symbol ...>` definitions (for example `src/renderer/src/components/ui/icons/symbols/controls`)
and generates a sibling folder with the same name plus `-temp`, containing inline `<svg>` React components (similar to `normal/12-play.tsx`).

- **Input**: `.../symbols/controls/*.tsx` (expects a `<symbol>` block in each file)
- **Output**: `.../symbols/controls-temp/*.tsx` + `.../symbols/controls-temp/index.tsx`

#### Run

From repo root:

```bash
pnpm --filter win-watch-electron run gen:icons-temp -- --in "src/renderer/src/components/ui/icons/symbols/controls"
```

#### CLI arguments

- `--in <folder>` / `-i <folder>` (**required**): input folder containing `*.tsx` files with a `<symbol ...>` block
- `--out <folder>` / `-o <folder>` (optional): output folder  
  Default: `<in>-temp`
- `--clean` (default): delete output folder before generating
- `--no-clean`: keep existing output folder contents and overwrite only generated files

Examples:

```bash
# default output: <in>-temp
pnpm --filter win-watch-electron run gen:icons-temp -- --in "src/renderer/src/components/ui/icons/symbols/controls"

# custom output folder + keep existing files
pnpm --filter win-watch-electron run gen:icons-temp -- --in "src/renderer/src/components/ui/icons/symbols/controls" --out "src/renderer/src/components/ui/icons/symbols/controls-temp" --no-clean

# if global tsx installed
tsx scripts/generate-normal/generate-normal-icons-from-symbols.ts --in "src/renderer/src/components/ui/icons/symbols/controls"
```

#### Notes

- The generated folder is intended for **temporary tweaking** and is not meant for production.
- The generator only converts the **first** `<symbol>` block found in each file.

