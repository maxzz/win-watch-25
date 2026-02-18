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

Optional:

- `--out "<folder>"`: override output folder (default is `<in>-temp`)
- `--no-clean`: do not delete existing output folder contents before generating

#### Notes

- The generated folder is intended for **temporary tweaking** and is not meant for production.
- The generator only converts the **first** `<symbol>` block found in each file.

