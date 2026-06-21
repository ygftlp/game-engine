import { build } from 'esbuild';
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = dirname(SCRIPT_DIR);
const EXAMPLE_ROOT = join(PROJECT_ROOT, 'examples', 'manual-starter');
const OUTPUT_DIR = join(PROJECT_ROOT, 'dist', 'examples', 'manual-starter');

function ensureDir(dir) {
  mkdirSync(dir, { recursive: true });
}

async function main() {
  rmSync(OUTPUT_DIR, { recursive: true, force: true });
  ensureDir(OUTPUT_DIR);

  await build({
    entryPoints: [join(EXAMPLE_ROOT, 'src', 'main.ts')],
    outfile: join(OUTPUT_DIR, 'main.js'),
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: ['es2019'],
    sourcemap: true,
    legalComments: 'none',
    define: {
      __DEV__: 'true',
      __APP_ENV__: '"development"'
    }
  });

  const html = readFileSync(join(EXAMPLE_ROOT, 'index.html'), 'utf8')
    .replace('./dist/main.js', './main.js');
  writeFileSync(join(OUTPUT_DIR, 'index.html'), html, 'utf8');
  copyFileSync(join(EXAMPLE_ROOT, 'README.md'), join(OUTPUT_DIR, 'README.md'));

  console.log('[example] built manual-starter -> dist/examples/manual-starter');
}

main().catch((error) => {
  console.error('[example] build failed');
  console.error(error);
  process.exitCode = 1;
});
