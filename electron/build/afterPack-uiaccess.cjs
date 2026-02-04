/* eslint-disable no-console */

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function run(exe, args, options = {}) {
  const result = spawnSync(exe, args, {
    stdio: 'inherit',
    shell: false,
    ...options,
  });

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`${exe} exited with code ${result.status}`);
  }
}

function whichWindows(exeName) {
  const pathEnv = process.env.PATH || '';
  const parts = pathEnv.split(';').filter(Boolean);
  const extensions = (process.env.PATHEXT || '.EXE;.CMD;.BAT;.COM')
    .split(';')
    .filter(Boolean);

  for (const dir of parts) {
    for (const ext of extensions) {
      const candidate = path.join(dir, exeName.endsWith(ext) ? exeName : `${exeName}${ext}`);
      if (fs.existsSync(candidate)) return candidate;
    }

    const direct = path.join(dir, exeName);
    if (fs.existsSync(direct)) return direct;
  }
  return null;
}

function pickMainExe(appOutDir, preferredBaseNames = []) {
  const entries = fs.readdirSync(appOutDir);
  const exes = entries.filter((f) => f.toLowerCase().endsWith('.exe'));

  const lowerPreferred = preferredBaseNames
    .filter(Boolean)
    .map((n) => (n.toLowerCase().endsWith('.exe') ? n.toLowerCase() : `${n.toLowerCase()}.exe`));

  for (const pref of lowerPreferred) {
    const hit = exes.find((f) => f.toLowerCase() === pref);
    if (hit) return path.join(appOutDir, hit);
  }

  // Avoid Electron helper executables if present.
  const blacklist = new Set([
    'chrome.exe',
    'chrome_proxy.exe',
    'crashpad_handler.exe',
    'notification_helper.exe',
    'elevated_tracing_service.exe',
  ]);

  const candidates = exes
    .filter((f) => !blacklist.has(f.toLowerCase()))
    .map((f) => path.join(appOutDir, f));

  if (candidates.length === 1) return candidates[0];
  if (candidates.length > 1) {
    // Prefer the largest exe (usually the main app binary).
    candidates.sort((a, b) => fs.statSync(b).size - fs.statSync(a).size);
    return candidates[0];
  }

  throw new Error(`Could not find app executable in ${appOutDir}`);
}

module.exports = async function afterPack(context) {
  const appOutDir = context.appOutDir;
  const manifestPath = path.join(context.packager.projectDir, 'build', 'winwatch-uiaccess.manifest');

  if (!fs.existsSync(manifestPath)) {
    throw new Error(`UIAccess manifest not found: ${manifestPath}`);
  }

  const appInfo = context.packager.appInfo;
  const preferredNames = [
    appInfo && appInfo.productFilename,
    appInfo && appInfo.productName,
    context.packager && context.packager.executableName,
  ];

  const exePath = pickMainExe(appOutDir, preferredNames);

  const mt = whichWindows('mt.exe');
  if (!mt) {
    throw new Error(
      'mt.exe not found in PATH. Install Windows SDK (includes Manifest Tool), or add mt.exe to PATH.'
    );
  }

  console.log(`Embedding UIAccess manifest into: ${exePath}`);
  run(mt, ['-nologo', '-manifest', manifestPath, `-outputresource:${exePath};#1`]);

  // Optional signing. UIAccess requires signing to actually work on default Windows policy.
  const pfxPath = process.env.WINWATCH_PFX;
  const pfxPassword = process.env.WINWATCH_PFX_PASSWORD;
  const timestampUrl = process.env.WINWATCH_TIMESTAMP_URL;

  if (!pfxPath || !pfxPassword) {
    console.log(
      'Skipping code signing (set WINWATCH_PFX and WINWATCH_PFX_PASSWORD to enable). ' +
        'Note: UIAccess will not be granted by Windows unless the EXE is signed and installed under Program Files.'
    );
    return;
  }

  const signtool = whichWindows('signtool.exe');
  if (!signtool) {
    throw new Error(
      'signtool.exe not found in PATH. Install Windows SDK (includes SignTool), or add signtool.exe to PATH.'
    );
  }

  console.log(`Signing executable: ${exePath}`);

  const args = ['sign', '/fd', 'SHA256', '/f', pfxPath, '/p', pfxPassword, '/v'];
  if (timestampUrl) {
    // RFC3161 timestamping
    args.push('/tr', timestampUrl, '/td', 'SHA256');
  }
  args.push(exePath);

  run(signtool, args);
};
