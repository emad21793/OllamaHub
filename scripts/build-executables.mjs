import fs from 'fs';
import path from 'path';
import { build } from 'esbuild';

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist');

async function main() {
  console.log('Building fully self-contained SEA executable...\n');

  // Step 1: Generate static files embedded as JS
  console.log('[1/4] Embedding static files into server...');
  const staticFiles = collectStaticFiles(DIST);
  const embedModule = generateEmbedModule(staticFiles);

  // Create a modified entry that auto-extracts static files on startup
  const entryContent = `
const fs = require('fs');
const path = require('path');
const os = require('os');

// Embedded static files (base64 encoded)
const STATIC_FILES = ${JSON.stringify(embedModule)};

// Extract static files to temp directory
const tmpDir = path.join(os.tmpdir(), 'ollama-hub-' + Date.now());
const distDir = path.join(tmpDir, 'dist');
for (const [filePath, base64] of Object.entries(STATIC_FILES)) {
  const fullPath = path.join(distDir, filePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, Buffer.from(base64, 'base64'));
}

// Change to the temp directory and start the server
process.chdir(tmpDir);

// Auto-open browser after a short delay (non-blocking)
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const openBrowser = async () => {
  await wait(2000);
  try {
    const platform = process.platform;
    if (platform === 'win32') {
      require('child_process').execSync('start http://localhost:3000', { stdio: 'ignore' });
    } else if (platform === 'darwin') {
      require('child_process').execSync('open http://localhost:3000', { stdio: 'ignore' });
    } else {
      require('child_process').execSync('xdg-open http://localhost:3000', { stdio: 'ignore' });
    }
  } catch {}
};
openBrowser();

// Now load and run the original server
require('./server-sea-core.cjs');
`;
  fs.writeFileSync(path.join(ROOT, 'dist', 'sea-launcher.js'), entryContent);
  console.log('  [OK] Generated sea launcher');

  // Step 2: Bundle the server code separately (core)
  console.log('[2/4] Bundling server core...');
  await build({
    entryPoints: ['server.ts'],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: 'dist/server-sea-core.cjs',
    sourcemap: false,
    external: [],
    define: {
      'process.env.NODE_ENV': '"production"',
    },
    plugins: [
      {
        name: 'stub-dev-deps',
        setup(build) {
          build.onResolve({ filter: /^vite$/ }, () => ({ path: 'vite-stub', namespace: 'stubs' }));
          build.onResolve({ filter: /^lightningcss$/ }, () => ({ path: 'lc-stub', namespace: 'stubs' }));
          build.onResolve({ filter: /^@tailwindcss\// }, () => ({ path: 'tw-stub', namespace: 'stubs' }));
          build.onResolve({ filter: /^esbuild$/ }, () => ({ path: 'es-stub', namespace: 'stubs' }));
          build.onLoad({ filter: /.*/, namespace: 'stubs' }, () => ({ contents: 'module.exports = {};' }));
        },
      },
    ],
    logLevel: 'warning',
  });
  console.log('  [OK] Server core bundled');

  // Step 3: Bundle the launcher (which includes embedded static files)
  // The launcher references './dist/server-sea-core.cjs' which becomes part of the blob
  // We need to inline the static files into the launcher and keep the core external
  // Actually, let's just bundle both together
  console.log('[3/4] Bundling standalone server with embedded files...');
  await build({
    entryPoints: ['dist/sea-launcher.js'],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: 'dist/server-standalone.cjs',
    sourcemap: false,
    external: [],
    plugins: [
      {
        name: 'stub-dev-deps',
        setup(build) {
          build.onResolve({ filter: /^vite$/ }, () => ({ path: 'vite-stub', namespace: 'stubs' }));
          build.onResolve({ filter: /^lightningcss$/ }, () => ({ path: 'lc-stub', namespace: 'stubs' }));
          build.onResolve({ filter: /^@tailwindcss\// }, () => ({ path: 'tw-stub', namespace: 'stubs' }));
          build.onResolve({ filter: /^esbuild$/ }, () => ({ path: 'es-stub', namespace: 'stubs' }));
          build.onLoad({ filter: /.*/, namespace: 'stubs' }, () => ({ contents: 'module.exports = {};' }));
        },
      },
    ],
    logLevel: 'warning',
  });
  console.log('  [OK] Standalone bundle created');

  // Step 4: Create SEA executable
  console.log('[4/4] Creating SEA executable...');
  const seaConfig = {
    main: 'dist/server-standalone.cjs',
    output: 'dist/sea-prep.blob',
    disableExperimentalSEAWarning: true,
  };
  fs.writeFileSync('sea-config.json', JSON.stringify(seaConfig, null, 2));

  const { execSync } = await import('child_process');
  execSync('node --experimental-sea-config sea-config.json', { stdio: 'inherit', cwd: ROOT });

  // Inject into node.exe
  const releaseDir = path.join(ROOT, 'release');
  if (!fs.existsSync(releaseDir)) fs.mkdirSync(releaseDir, { recursive: true });

  const nodeExe = process.execPath;
  const outExe = path.join(releaseDir, 'ollama-hub-win.exe');
  fs.copyFileSync(nodeExe, outExe);

  const postject = await import('postject');
  await postject.inject(outExe, 'NODE_SEA_BLOB', fs.readFileSync(path.join(ROOT, 'dist', 'sea-prep.blob')), {
    sentinelFuse: 'NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2',
    machoSegmentName: 'NODE_SEA_BLOB',
  });

  const size = fs.statSync(outExe).size;
  console.log(`\n[OK] Standalone executable: release/ollama-hub-win.exe (${(size / 1024 / 1024).toFixed(1)} MB)`);
  console.log('     This .exe includes Node.js runtime + server + static frontend files.');
  console.log('     NO dependencies needed - just run it!');
}

function collectStaticFiles(distDir) {
  const files = {};
  function walk(dir, prefix) {
    for (const f of fs.readdirSync(dir)) {
      const fp = path.join(dir, f);
      const key = prefix ? prefix + '/' + f : f;
      if (key === 'server.cjs' || key === 'server-bundled.cjs' || key === 'server-sea.cjs' || key === 'server-sea-core.cjs' || key === 'server-standalone.cjs' || key === 'sea-prep.blob' || key === 'sea-entry.js' || key === 'sea-launcher.js') continue;
      if (fs.statSync(fp).isDirectory()) {
        walk(fp, key);
      } else {
        files[key] = fs.readFileSync(fp).toString('base64');
      }
    }
  }
  walk(distDir, '');
  return files;
}

function generateEmbedModule(files) {
  const result = {};
  for (const [key, base64] of Object.entries(files)) {
    result[key] = base64;
  }
  return result;
}

main().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});
