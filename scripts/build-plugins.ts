/**
 * Build script for native plugins
 * 
 * Usage:
 *   npx tsx scripts/build-plugins.ts [--debug|--release] [--native-only|--napi-only]
 * 
 * Options:
 *   --debug       Build debug configuration (default)
 *   --release     Build release configuration
 *   --native-only Only build the native DLL
 *   --napi-only   Only build the NAPI plugin
 */

import { execSync } from 'node:child_process';
import { cpSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ROOT_DIR = join(__dirname, '..');
const NATIVE_DIR = join(ROOT_DIR, 'native');
const NAPI_DIR = join(ROOT_DIR, 'napi-plugin');
const OUTPUT_DIR = join(ROOT_DIR, 'dist-electron', 'plugins');

// vswhere.exe is installed with Visual Studio and can locate VS installations
const VSWHERE_PATH = 'C:\\Program Files (x86)\\Microsoft Visual Studio\\Installer\\vswhere.exe';

interface VSInfo {
    msbuildPath: string;
    platformToolset: string;
    version: string;
}

/**
 * Map VS major version to platform toolset
 */
function getPlatformToolset(vsMajorVersion: number): string {
    const toolsetMap: Record<number, string> = {
        15: 'v141',  // VS 2017
        16: 'v142',  // VS 2019
        17: 'v143',  // VS 2022
        18: 'v144',  // VS 2026
    };
    return toolsetMap[vsMajorVersion] || 'v143'; // Default to v143
}

/**
 * Find Visual Studio installation info using vswhere.exe
 * Returns MSBuild path and platform toolset
 */
function findVSInfo(): VSInfo | null {
    if (!existsSync(VSWHERE_PATH)) {
        console.warn('vswhere.exe not found. Make sure Visual Studio is installed.');
        return null;
    }

    try {
        // Find the latest VS installation
        const vsPath = execSync(
            `"${VSWHERE_PATH}" -latest -requires Microsoft.Component.MSBuild -property installationPath`,
            { encoding: 'utf8' }
        ).trim();

        if (!vsPath) {
            console.warn('No Visual Studio installation with MSBuild found.');
            return null;
        }

        // Get VS version
        const vsVersion = execSync(
            `"${VSWHERE_PATH}" -latest -requires Microsoft.Component.MSBuild -property installationVersion`,
            { encoding: 'utf8' }
        ).trim();

        const msbuildPath = join(vsPath, 'MSBuild', 'Current', 'Bin', 'MSBuild.exe');
        
        if (!existsSync(msbuildPath)) {
            console.warn(`MSBuild.exe not found at expected path: ${msbuildPath}`);
            return null;
        }

        // Extract major version (e.g., "17.8.34309.116" -> 17)
        const majorVersion = parseInt(vsVersion.split('.')[0], 10);
        const platformToolset = getPlatformToolset(majorVersion);

        console.log(`Found Visual Studio ${vsVersion} at: ${vsPath}`);
        console.log(`Using Platform Toolset: ${platformToolset}`);
        console.log(`MSBuild path: ${msbuildPath}`);

        return {
            msbuildPath,
            platformToolset,
            version: vsVersion,
        };
    } catch (error) {
        console.warn('Failed to locate Visual Studio using vswhere:', error);
        return null;
    }
}

interface BuildOptions {
    config: 'Debug' | 'Release';
    buildNative: boolean;
    buildNapi: boolean;
}

function parseArgs(): BuildOptions {
    const args = process.argv.slice(2);

    return {
        config: args.includes('--debug') ? 'Debug' : 'Release',
        buildNative: !args.includes('--napi-only'),
        buildNapi: !args.includes('--native-only'),
    };
}

function ensureOutputDir(): void {
    if (!existsSync(OUTPUT_DIR)) {
        mkdirSync(OUTPUT_DIR, { recursive: true });
        console.log(`Created output directory: ${OUTPUT_DIR}`);
    }
}

function buildNative(config: 'Debug' | 'Release'): void {
    console.log(`\n=== Building native project (${config}) ===\n`);

    // Try to find Visual Studio automatically
    const vsInfo = findVSInfo();
    
    if (!vsInfo) {
        console.error('Visual Studio not found. Please ensure Visual Studio is installed with C++ workload.');
        console.error('Alternatively, run this script from a Visual Studio Developer Command Prompt.');
        process.exit(1);
    }

    // Build with auto-detected platform toolset
    const msbuildCmd = `"${vsInfo.msbuildPath}" WindowMonitor.vcxproj /p:Configuration=${config} /p:Platform=x64 /p:PlatformToolset=${vsInfo.platformToolset} /verbosity:minimal`;

    try {
        execSync(msbuildCmd, { cwd: NATIVE_DIR, stdio: 'inherit' });
        console.log(`Native build (${config}) completed successfully`);
    } catch (error) {
        console.error(`Native build failed`);
        process.exit(1);
    }
}

function buildNapi(config: 'Debug' | 'Release'): void {
    console.log(`\n=== Building NAPI plugin (${config}) ===\n`);

    const isDebug = config === 'Debug';
    const gypCmd = isDebug
        ? 'node-gyp rebuild --debug -- -Dnative_config=Debug'
        : 'node-gyp rebuild';

    try {
        execSync(gypCmd, { cwd: NAPI_DIR, stdio: 'inherit' });
        console.log(`NAPI plugin build (${config}) completed successfully`);
    } catch (error) {
        console.error(`NAPI plugin build failed`);
        process.exit(1);
    }
}

function copyFiles(config: 'Debug' | 'Release'): void {
    console.log(`\n=== Copying files to ${OUTPUT_DIR} ===\n`);

    // Source paths
    const dllSrc = join(NATIVE_DIR, 'x64', config, 'WindowMonitor.dll');
    const nodeSrc = join(NAPI_DIR, 'build', config, 'winwatch.node');

    // Destination paths
    const dllDest = join(OUTPUT_DIR, 'WindowMonitor.dll');
    const nodeDest = join(OUTPUT_DIR, 'winwatch.node');

    // Copy DLL if it exists
    if (existsSync(dllSrc)) {
        cpSync(dllSrc, dllDest);
        console.log(`Copied: ${dllSrc} -> ${dllDest}`);
    } else {
        console.warn(`Warning: DLL not found at ${dllSrc}`);
    }

    // Copy .node file if it exists
    if (existsSync(nodeSrc)) {
        cpSync(nodeSrc, nodeDest);
        console.log(`Copied: ${nodeSrc} -> ${nodeDest}`);
    } else {
        console.warn(`Warning: .node file not found at ${nodeSrc}`);
    }
}

function main(): void {
    const options = parseArgs();

    console.log(`Build configuration: ${options.config}`);
    console.log(`Build native: ${options.buildNative}`);
    console.log(`Build NAPI: ${options.buildNapi}`);

    ensureOutputDir();

    if (options.buildNative) {
        buildNative(options.config);
    }

    if (options.buildNapi) {
        buildNapi(options.config);
    }

    copyFiles(options.config);

    console.log(`\n=== Build completed successfully ===\n`);
}

main();
