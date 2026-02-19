## convert-svg

Generate **two React TSX components** from a single `.svg` file.

- **Normal file**: `<base>.tsx`
  - `SvgSymbol<Name>()` renders a `<symbol ...>` block
  - `Symbol<Name>(...)` renders an `<svg> ... <use xlinkHref="#..."/> </svg>` wrapper (same shape as `electron/src/renderer/src/components/ui/icons/symbols/controls/1-control-button.tsx`)
- **Temp file**: `<base>-temp.tsx` (suffix configurable)
  - `Icon<Name>(...)` renders an inline `<svg>` (same shape as `electron/src/renderer/src/components/ui/icons/symbols/controls-temp/1-control-button.tsx`)

Both files are generated into the **same folder** (by default: the SVG file’s folder).

## Requirements

- Run from repo root
- `pnpm install` already done (repo already has `tsx` in devDependencies)

## Usage

From the repo root:

```bash
pnpm tsx convert-svg/cli.ts "<path-to-svg>"
```

Example:

```bash
pnpm tsx convert-svg/cli.ts "electron/src/assets/icons/controls/svg/window.svg"
```

This will generate:

- `electron/src/assets/icons/controls/svg/window.tsx`
- `electron/src/assets/icons/controls/svg/window-temp.tsx`

## CLI options

```bash
pnpm tsx convert-svg/cli.ts <svg-file> [options]
```

- **`-h, --help`**: Show help
- **`-o, --out-dir <dir>`**: Output directory  
  - Default: SVG file directory
- **`--out-base <base>`**: Output file base name (no extension)  
  - Default: SVG filename without extension
  - Output filenames become `<base>.tsx` and `<base><tempSuffix>.tsx`
- **`--name <PascalName>`**: Base name for exported components  
  - Default: derived from symbol id
  - Generated component names:
    - `SvgSymbol<P>` + `Symbol<P>` + `Icon<P>`
- **`--symbol-id, --id <id>`**: `<symbol id="...">` and `<use xlinkHref="#..."/>` value  
  - Default: derived from output base
  - If output base looks like `1-control-button`, default symbol id becomes `control-button`
- **`--temp-suffix <suffix>`**: Temp file suffix  
  - Default: `-temp`
- **`-f, --force`**: Overwrite existing output files
- **`--dry-run`**: Print what would be generated (no writes)

## Naming defaults

If you run on a file named `1-control-button.svg`:

- output base: `1-control-button`
- default symbol id: `control-button`
- default component base name: `ControlButton`
- output files:
  - `1-control-button.tsx`
  - `1-control-button-temp.tsx`

## Notes / limitations

- The converter does basic SVG→JSX fixes (e.g. `class` → `className`, `stroke-width` → `strokeWidth`).
- `<style>...</style>` blocks are converted to JSX-safe template literals so curly braces don’t break TSX parsing.

