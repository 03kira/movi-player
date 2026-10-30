#!/usr/bin/env node
import { access, mkdir } from 'fs/promises';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const wasmDir = join(rootDir, 'dist', 'wasm');
const requiredFiles = ['movi.js', 'movi.wasm'];

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

const hasPrebuiltArtifacts = await Promise.all(
  requiredFiles.map((file) => fileExists(join(wasmDir, file)))
);

if (hasPrebuiltArtifacts.every(Boolean)) {
  console.log('[build-wasm] Found existing WASM artifacts in dist/wasm. Skipping Docker build.');
  process.exit(0);
}

await mkdir(wasmDir, { recursive: true });

const result = spawnSync('docker', ['compose', 'run', '--rm', 'build'], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: false,
});

if (result.error) {
  console.error('[build-wasm] Docker is not available in this environment.');
  console.error('[build-wasm] This repo needs FFmpeg/WebAssembly build artifacts before deployment.');
  console.error('[build-wasm] Fix: build locally with Docker and commit the generated dist/wasm files,');
  console.error('[build-wasm] or deploy a prebuilt artifact bundle instead of running the root build on Vercel.');
  process.exit(1);
}

process.exit(result.status ?? 1);
