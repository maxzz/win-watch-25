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

### (Optional) Fix editor errors in `napi-plugin/src/binding.cpp` (clangd)

If `binding.cpp` shows red squiggles like “`napi.h` file not found”, that’s usually **clangd** missing Node/N-API include paths.

We auto-generate `napi-plugin/.clangd` using:
- `napi-plugin/scripts/update-clangd.mjs`

Commands:

```bash
# Regenerate .clangd (auto-detects node-gyp header cache path)
pnpm -C napi-plugin update:clangd
```

Notes:
- This also runs automatically on `pnpm -C napi-plugin install` via `postinstall`.
- If you change Node versions, re-run `pnpm -C napi-plugin update:clangd`, then reload the editor window (or restart clangd).

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

## Packaging (Windows)

This repo packages the Windows app using **electron-builder** with an **NSIS** installer.

Build the installer from the repo root:
```bash
pnpm run build:exe:win
```

Output is written to `electron/dist/`.

### UIAccess support (Windows only)

If you need `uiAccess=true` (assistive technology / UI Automation scenarios), Windows requires:
1. The app EXE has an embedded manifest with `uiAccess="true"`.
2. The EXE is **code-signed** (Authenticode).
3. The app is installed in a **secure location** such as **Program Files**.

This repo configures NSIS to install **per-machine** (Program Files) and runs a post-pack step that embeds the UIAccess manifest.

#### Code signing (optional but required for UIAccess to actually work)

The `afterPack` hook will sign the final EXE if you provide these environment variables:
- `WINWATCH_PFX` - path to a `.pfx` code-signing certificate
- `WINWATCH_PFX_PASSWORD` - password for the `.pfx`
- `WINWATCH_TIMESTAMP_URL` - optional RFC3161 timestamp server URL

You also need Windows SDK tools available on `PATH`:
- `mt.exe` (Manifest Tool)
- `signtool.exe` (SignTool) when signing is enabled

Note: If you embed `uiAccess="true"` but the EXE is not signed with a certificate trusted by the machine, Windows may refuse to start it with the message:
"A referral was returned from the server."

To avoid that, this repo only embeds the `uiAccess="true"` manifest when code signing is configured (WINWATCH_PFX + WINWATCH_PFX_PASSWORD).

To verify a built EXE is properly signed:
```bat
signtool verify /pa /v "path\to\WinWatch.exe"
```

### Dev signing with a self-signed certificate (Windows)

If you don’t have a commercial CA code-signing certificate yet, you can create a **self-signed** certificate for **development/testing on your own machine(s)**.

Important:
- This is **not** suitable for public distribution. Other machines won’t trust your EXE unless you install your certificate into their trust stores.
- For `uiAccess=true`, Windows requires the EXE to be trusted. With a self-signed cert, that means you must add it to **Trusted Root Certification Authorities** and **Trusted Publishers** on the machine.

Quick start (recommended): use the helper script

Run PowerShell as **Administrator** in the repo root:
```powershell
./scripts/setup-dev-codesign.ps1 -OutputDir (Resolve-Path .)
```

It will:
- Create (or reuse) a LocalMachine code-signing cert
- Export `winwatch-dev-codesign.pfx` + `winwatch-dev-codesign.cer` into `-OutputDir`
- Trust the cert by importing it into LocalMachine `Root` and `TrustedPublisher`
- Print the exact env vars to set for `pnpm run build:exe:win`

#### 1) Create a code-signing certificate (PowerShell as Administrator)

Open **Windows Terminal / PowerShell** as **Administrator** and run:

```powershell
$subject = "CN=WinWatch Dev Code Signing"

$cert = New-SelfSignedCertificate \
	-Subject $subject \
	-Type CodeSigningCert \
	-KeyAlgorithm RSA \
	-KeyLength 2048 \
	-HashAlgorithm SHA256 \
	-KeyExportPolicy Exportable \
	-CertStoreLocation "Cert:\LocalMachine\My" \
	-NotAfter (Get-Date).AddYears(3)

$cert.Thumbprint
```

This creates the cert in the Local Machine “Personal” store.

#### 2) Export it to a PFX file (for electron-builder hook)

```powershell
$pfxPath = Join-Path $PWD "winwatch-dev-codesign.pfx"
$pfxPassword = Read-Host -AsSecureString "PFX password"

Export-PfxCertificate -Cert ("Cert:\LocalMachine\My\" + $cert.Thumbprint) -FilePath $pfxPath -Password $pfxPassword

$pfxPath
```

#### 3) Trust the certificate on the machine

Export the public certificate (.cer) and import it into the two trust stores:

```powershell
$cerPath = Join-Path $PWD "winwatch-dev-codesign.cer"

Export-Certificate -Cert ("Cert:\LocalMachine\My\" + $cert.Thumbprint) -FilePath $cerPath | Out-Null

# Trust chain
Import-Certificate -FilePath $cerPath -CertStoreLocation "Cert:\LocalMachine\Root" | Out-Null

# Trust publisher (important for Authenticode trust decisions)
Import-Certificate -FilePath $cerPath -CertStoreLocation "Cert:\LocalMachine\TrustedPublisher" | Out-Null

$cerPath
```

If you prefer GUI:
- Run `certlm.msc`
- Import the `.cer` into:
	- Local Computer → **Trusted Root Certification Authorities**
	- Local Computer → **Trusted Publishers**

#### 4) Build with signing enabled

From `cmd.exe` (recommended if PowerShell blocks pnpm scripts), set env vars and build:

```bat
set WINWATCH_PFX=C:\path\to\winwatch-dev-codesign.pfx
set WINWATCH_PFX_PASSWORD=yourPfxPassword

REM Optional (recommended): your timestamp server URL
REM set WINWATCH_TIMESTAMP_URL=https://timestamp.digicert.com

pnpm run build:exe:win
```

Notes:
- Timestamping is optional for dev. For production, always timestamp.
- The build hook will also auto-locate `mt.exe` / `signtool.exe` in Windows Kits; if that fails you can set:
	- `WINWATCH_MT_EXE`
	- `WINWATCH_SIGNTOOL_EXE`

#### 5) Verify the signature on the installed EXE

```bat
signtool verify /pa /v "C:\Program Files\WinWatch\WinWatch.exe"
```

If you see signature verification failures, the cert may not be trusted (repeat step 3) or you may be running the EXE built without signing.

Troubleshooting:
- If you installed Windows SDK but `mt.exe` / `signtool.exe` aren’t on `PATH`, they’re usually under:
	- `C:\Program Files (x86)\Windows Kits\10\bin\<version>\x64\mt.exe`
	- `C:\Program Files (x86)\Windows Kits\10\bin\<version>\x64\signtool.exe`
- You can also explicitly point the build hook at the tools:
	- `WINWATCH_MT_EXE` (full path to `mt.exe`)
	- `WINWATCH_SIGNTOOL_EXE` (full path to `signtool.exe`)
