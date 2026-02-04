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

function listSubdirs(dir) {
  try {
    return fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
  } catch {
    return [];
  }
}

function parseVersionLike(name) {
  // Windows Kits uses version-like folder names, e.g. "10.0.26100.0".
  const parts = name.split('.').map((p) => Number.parseInt(p, 10));
  if (parts.some((n) => Number.isNaN(n))) return null;
  return parts;
}

function compareVersionPartsDesc(a, b) {
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i += 1) {
    const av = a[i] ?? 0;
    const bv = b[i] ?? 0;
    if (av !== bv) return bv - av;
  }
  return 0;
}

function findInWindowsKits(toolExeName) {
  const programFilesX86 = process.env['ProgramFiles(x86)'] || process.env.ProgramFiles;
  if (!programFilesX86) return null;

  const candidates = [];

  // Common locations:
  // - C:\Program Files (x86)\Windows Kits\10\bin\10.0.x.y\x64\mt.exe
  // - C:\Program Files (x86)\Windows Kits\10\bin\x64\mt.exe (older)
  // - C:\Program Files (x86)\Windows Kits\8.1\bin\x64\mt.exe
  const roots = [
    path.join(programFilesX86, 'Windows Kits', '10', 'bin'),
    path.join(programFilesX86, 'Windows Kits', '8.1', 'bin'),
  ];

  for (const root of roots) {
    // First, try non-versioned layout.
    for (const arch of ['x64', 'arm64', 'x86']) {
      const p = path.join(root, arch, toolExeName);
      if (fs.existsSync(p)) candidates.push(p);
    }

    // Then, versioned layout (Windows Kits 10).
    const versions = listSubdirs(root)
      .map((name) => ({ name, ver: parseVersionLike(name) }))
      .filter((x) => x.ver)
      .sort((a, b) => compareVersionPartsDesc(a.ver, b.ver));

    for (const v of versions) {
      for (const arch of ['x64', 'arm64', 'x86']) {
        const p = path.join(root, v.name, arch, toolExeName);
        if (fs.existsSync(p)) return p;
      }
    }
  }

  return candidates[0] || null;
}

function resolveTool(envVar, exeName) {
  const explicit = process.env[envVar];
  if (explicit) {
    if (!fs.existsSync(explicit)) {
      throw new Error(`${envVar} was set but does not exist: ${explicit}`);
    }
    return explicit;
  }

  const onPath = whichWindows(exeName);
  if (onPath) return onPath;

  const inKits = findInWindowsKits(exeName);
  if (inKits) return inKits;

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

  const mt = resolveTool('WINWATCH_MT_EXE', 'mt.exe');
  if (!mt) {
    throw new Error(
      'mt.exe not found. Install Windows SDK (Manifest Tool), add it to PATH, or set WINWATCH_MT_EXE to the full path.'
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

  const signtool = resolveTool('WINWATCH_SIGNTOOL_EXE', 'signtool.exe');
  if (!signtool) {
    throw new Error(
      'signtool.exe not found. Install Windows SDK (SignTool), add it to PATH, or set WINWATCH_SIGNTOOL_EXE to the full path.'
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
