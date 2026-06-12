import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const REQUIRED_NODE_MAJOR = 18;
const MIN_NPM_MAJOR = 8;

function run(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', timeout: 10000 }).trim();
  } catch {
    return '';
  }
}

function checkNode() {
  const version = run('node --version');
  if (!version) {
    console.error('[FAIL] Node.js is NOT installed. Install Node.js v18+ from https://nodejs.org');
    return false;
  }
  const major = parseInt(version.replace('v', '').split('.')[0], 10);
  if (major < REQUIRED_NODE_MAJOR) {
    console.error(`[FAIL] Node.js ${version} is too old. Need v${REQUIRED_NODE_MAJOR}+`);
    return false;
  }
  console.log(`[OK]   Node.js ${version}`);
  return true;
}

function checkNpm() {
  const version = run('npm --version');
  if (!version) {
    console.error('[FAIL] npm is NOT installed');
    return false;
  }
  const major = parseInt(version.split('.')[0], 10);
  if (major < MIN_NPM_MAJOR) {
    console.error(`[FAIL] npm ${version} is too old. Need v${MIN_NPM_MAJOR}+`);
    return false;
  }
  console.log(`[OK]   npm ${version}`);
  return true;
}

function checkOllama() {
  const version = run('ollama --version');
  if (!version) {
    console.warn('[WARN] Ollama not found in PATH. Install from https://ollama.com (optional if using Sandbox mode)');
    return false;
  }
  console.log(`[OK]   Ollama ${version}`);
  return true;
}

function checkOllamaRunning() {
  try {
    const resp = run('curl -s http://localhost:11434/api/tags');
    if (resp) {
      console.log('[OK]   Ollama service is running on http://localhost:11434');
      return true;
    }
  } catch {}
  console.warn('[WARN] Ollama service not reachable at http://localhost:11434 (ok if using Sandbox mode)');
  return false;
}

function checkDiskSpace() {
  const buildSize = 200; // MB approx needed
  try {
    const platform = process.platform;
    if (platform === 'win32') {
      const drive = process.cwd().split(path.sep)[0];
      const output = run(`wmic logicaldisk where caption="${drive}" get freespace /format:value`);
      const match = output.match(/FreeSpace=(\d+)/);
      if (match) {
        const freeBytes = parseInt(match[1], 10);
        const freeGB = freeBytes / (1024 * 1024 * 1024);
        if (freeGB < 0.5) {
          console.error(`[FAIL] Low disk space: ~${freeGB.toFixed(1)}GB free. Need at least 500MB`);
          return false;
        }
        console.log(`[OK]   Disk space: ~${freeGB.toFixed(1)}GB free`);
        return true;
      }
    } else {
      const stat = execSync('df -k . | tail -1', { encoding: 'utf8' });
      const parts = stat.split(/\s+/);
      const freeKB = parseInt(parts[3], 10);
      const freeGB = freeKB / (1024 * 1024);
      if (freeGB < 0.5) {
        console.error(`[FAIL] Low disk space: ~${freeGB.toFixed(1)}GB free`);
        return false;
      }
      console.log(`[OK]   Disk space: ~${freeGB.toFixed(1)}GB free`);
      return true;
    }
  } catch {}
  console.log('[INFO] Could not check disk space');
  return true;
}

function checkGit() {
  const version = run('git --version');
  if (version) {
    console.log(`[OK]   ${version}`);
    return true;
  }
  console.warn('[WARN] Git not found (optional)');
  return false;
}

function main() {
  console.log('=== Ollama Hub & Control Center - Prerequisites Check ===\n');

  const results = {
    node: checkNode(),
    npm: checkNpm(),
    ollama: checkOllama(),
    ollamaRunning: false,
    disk: checkDiskSpace(),
    git: checkGit(),
  };

  console.log('');

  if (results.ollama) {
    results.ollamaRunning = checkOllamaRunning();
  }

  console.log('');
  console.log('=== Summary ===');
  const allPass = results.node && results.npm && results.disk;
  if (allPass) {
    console.log('All critical checks passed. Ready to install.');
    process.exit(0);
  } else {
    console.error('Some critical checks failed. Fix the issues above and re-run.');
    process.exit(1);
  }
}

main();
