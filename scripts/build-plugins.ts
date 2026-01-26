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
    
    const msbuildCmd = `msbuild WindowMonitor.vcxproj /p:Configuration=${config} /p:Platform=x64 /verbosity:minimal`;
    
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
