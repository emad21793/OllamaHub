import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();

const patterns = [
  'dist/*.map',
  'dist/**/*.map',
  'dist/.vite/**',
];

const dirs = [
  '.antigravitycli',
  '.git',
];

const description = [
  'Removes source maps from dist/',
  'Removes Vite cache from dist/',
  'Removes .antigravitycli/ and .git/ if --deep is passed',
];

function removeMatching(pattern) {
  const base = pattern.includes('*') ? pattern.split('*')[0] : pattern;
  const full = path.join(ROOT, pattern);
  const dir = path.dirname(full);
  if (!fs.existsSync(dir)) return;

  if (pattern.endsWith('**')) {
    const targetDir = path.join(ROOT, pattern.replace('/**', ''));
    if (fs.existsSync(targetDir)) {
      fs.rmSync(targetDir, { recursive: true, force: true });
      console.log(`  [REMOVED] ${path.relative(ROOT, targetDir)}/`);
    }
    return;
  }

  const files = fs.readdirSync(dir);
  const baseName = path.basename(pattern).replace('*', '');
  for (const file of files) {
    if (file.endsWith('.map')) {
      const fp = path.join(dir, file);
      fs.unlinkSync(fp);
      console.log(`  [REMOVED] ${path.relative(ROOT, fp)}`);
    }
  }
}

function removeDir(dirPath) {
  const full = path.join(ROOT, dirPath);
  if (fs.existsSync(full)) {
    fs.rmSync(full, { recursive: true, force: true });
    console.log(`  [REMOVED] ${dirPath}/`);
  }
}

function main() {
  const args = process.argv.slice(2);
  const deep = args.includes('--deep');

  console.log('=== Ollama Hub - Cleanup ===\n');

  // Always clean source maps
  console.log('Cleaning build artifacts...');
  for (const p of patterns) {
    removeMatching(p);
  }

  // Clean dist/.vite cache
  const viteCache = path.join(ROOT, 'dist', '.vite');
  if (fs.existsSync(viteCache)) {
    fs.rmSync(viteCache, { recursive: true, force: true });
    console.log('  [REMOVED] dist/.vite/');
  }

  // Optionally remove deep directories
  if (deep) {
    console.log('\nDeep cleaning (--deep)...');
    for (const d of dirs) {
      removeDir(d);
    }
  }

  console.log('\n[OK] Cleanup complete');
}

main();
