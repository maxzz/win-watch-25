# Typescript utility for SVG to React components
_Exported on 2/17/2026 at 21:55:15 PST from Cursor (2.5.17)_

---

**User**

Create typescript utility in folder @convert-svg that will receive as argument svg file. The utility should create two react components in two files. One component should look like @electron/src/renderer/src/components/ui/icons/symbols/controls/1-control-button.tsx and second file should be like @electron/src/renderer/src/components/ui/icons/symbols/controls-temp/1-control-button.tsx . Put new files into the same folder. First file with the same name as SVG file and the second file with the same name but suffix "-temp". Add ability to specify optionally output names. Create README.ms file with instructions and examples on how to start and CLI options details.

---

**Cursor**

Got it. I’ll first inspect the two reference component files to match their exact structure, then create a new `convert-svg` CLI that reads an `.svg` file and emits **two `.tsx` React components** (normal + `-temp`) into the SVG’s folder, with optional overrides for output file/component names. Finally I’ll add a `README.ms` with install/run examples and full CLI option docs.

Quick adjustment: the file search call is erroring on Windows paths, so I’m going to switch to forward-slash absolute paths and directly read the `controls-temp` reference file + root config to mirror your project’s existing setup.

I’ve got the exact shapes of both “symbol” and “temp icon” components now. Next I’ll inspect your repo’s Node/TS setup (package scripts, tsconfig) and then implement `convert-svg` as a small CLI that outputs those two component styles from any `.svg`.

I’m going to implement the new `convert-svg` CLI by reusing the code style from your existing `electron/scripts/generate-normal` generator, but with SVG→TSX conversion (including safe handling of `<style>` blocks). After that, I’ll run it once on `window.svg` to verify it generates the two expected files.

### What I added

- **New CLI utility**: `convert-svg/cli.ts`
  - Takes an **SVG file path** and generates **two TSX React component files** into the **same folder** (default: SVG’s folder)
  - **Normal file**: `<svgBase>.tsx` (symbol + `<use/>` wrapper) matching the shape of `electron/src/renderer/src/components/ui/icons/symbols/controls/1-control-button.tsx`
  - **Temp file**: `<svgBase>-temp.tsx` (inline `<svg>`) matching the shape of `electron/src/renderer/src/components/ui/icons/symbols/controls-temp/1-control-button.tsx`
  - Supports optional output naming overrides (`--out-dir`, `--out-base`, `--name`, `--symbol-id/--id`, `--temp-suffix`)

- **Docs**: `convert-svg/README.ms` (usage + examples + full option list)

### How to run

```bash
pnpm tsx convert-svg/cli.ts "path/to/icon.svg"
```

Examples and all CLI options are in `convert-svg/README.ms`.

