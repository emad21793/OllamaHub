import { build } from 'esbuild';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

async function runBuild() {
  try {
    console.log("Building client-side bundles with Vite...");
    // Find the Vite JS entrypoint
    const viteCliPath = path.join('node_modules', 'vite', 'bin', 'vite.js');
    execSync(`node "${viteCliPath}" build`, { stdio: 'inherit' });

    console.log("Bundling server-side TypeScript with esbuild...");
    await build({
      entryPoints: ['server.ts'],
      bundle: true,
      platform: 'node',
      format: 'cjs',
      packages: 'external',
      sourcemap: true,
      outfile: 'dist/server.cjs',
    });

    console.log("Build successfully completed!");
  } catch (err) {
    console.error("Build failed:", err);
    process.exit(1);
  }
}

runBuild();
