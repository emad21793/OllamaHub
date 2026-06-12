import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ROOT = process.cwd();
const DEPLOY = path.join(ROOT, 'deploy');

const REQUIRED_FILES = [
  'dist/server.cjs',
  'dist/index.html',
  'dist/assets/',
  'package.json',
];

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function copyDir(src, dest) {
  ensureDir(dest);
  for (const entry of fs.readdirSync(src)) {
    const s = path.join(src, entry);
    const d = path.join(dest, entry);
    if (fs.statSync(s).isDirectory()) {
      copyDir(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

function main() {
  console.log('=== Ollama Hub - Production Package ===\n');

  // Verify build exists
  for (const f of REQUIRED_FILES) {
    const fp = path.join(ROOT, f);
    if (!fs.existsSync(fp)) {
      console.error(`[FAIL] Missing: ${f}. Run 'npm run build' first.`);
      process.exit(1);
    }
  }

  // Clean previous deploy
  if (fs.existsSync(DEPLOY)) {
    fs.rmSync(DEPLOY, { recursive: true, force: true });
  }

  // 1. Copy dist/ (built app)
  console.log('[1/3] Copying dist/ (built application)...');
  copyDir(path.join(ROOT, 'dist'), path.join(DEPLOY, 'dist'));

  // 2. Install production-only node_modules
  console.log('[2/3] Installing production dependencies...');
  execSync('npm install --production --no-audit --no-fund', {
    cwd: ROOT,
    stdio: 'inherit',
  });

  // Copy only production node_modules
  copyDir(path.join(ROOT, 'node_modules'), path.join(DEPLOY, 'node_modules'));
  console.log('  [OK] Production node_modules copied');

  // 3. Copy runtime files
  console.log('[3/3] Copying runtime files...');
  const runtimeFiles = [
    'package.json',
    '.env',
  ];
  for (const f of runtimeFiles) {
    const src = path.join(ROOT, f);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(DEPLOY, f));
      console.log(`  [OK] ${f}`);
    }
  }

  // Create start script for the package
  const isWin = process.platform === 'win32';
  const startContent = isWin
    ? '@echo off\r\ncd /d "%~dp0"\r\nnode dist\\server.cjs\r\npause\r\n'
    : '#!/usr/bin/env bash\ncd "$(dirname "$0")"\nexec node dist/server.cjs\n';
  const startFile = isWin ? 'start.bat' : 'start.sh';
  fs.writeFileSync(path.join(DEPLOY, startFile), startContent);
  if (!isWin) {
    fs.chmodSync(path.join(DEPLOY, startFile), '755');
  }
  console.log(`  [OK] ${startFile}`);

  // Create .env template if no .env
  if (!fs.existsSync(path.join(DEPLOY, '.env'))) {
    fs.writeFileSync(
      path.join(DEPLOY, '.env'),
      'OLLAMA_URL=http://localhost:11434\n# GEMINI_API_KEY=your-key-here\n'
    );
    console.log('  [OK] .env (default)');
  }

  console.log(`\n[OK] Package created at: ${DEPLOY}`);
  console.log(`     Size: ~${getDirSize(DEPLOY)} MB`);
}

function getDirSize(dir) {
  let size = 0;
  function walk(d) {
    for (const f of fs.readdirSync(d)) {
      const p = path.join(d, f);
      if (fs.statSync(p).isDirectory()) walk(p);
      else size += fs.statSync(p).size;
    }
  }
  walk(dir);
  return (size / 1024 / 1024).toFixed(1);
}

main();
