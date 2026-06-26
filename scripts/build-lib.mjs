// esbuild 构建脚本：生成可被外部项目引用的库格式
import { build, context } from 'esbuild';
import { mkdirSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const watch = process.argv.includes('--watch');

// 库模式构建配置
const libConfig = {
  entryPoints: ['src/engine/index.ts'],
  bundle: true,
  platform: 'neutral',
  target: ['es2019'],
  sourcemap: true,
  minify: false,
  external: [], // 如果有外部依赖需要声明
  define: {
    __DEV__: 'false',
    __APP_ENV__: '"production"'
  }
};

async function run() {
  mkdirSync('dist/lib', { recursive: true });
  mkdirSync('dist/types', { recursive: true });

  // 1. 构建ESM格式
  await build({
    ...libConfig,
    outfile: 'dist/lib/index.mjs',
    format: 'esm',
  });

  // 2. 构建CJS格式
  await build({
    ...libConfig,
    outfile: 'dist/lib/index.cjs',
    format: 'cjs',
  });

  // 3. 生成TypeScript类型声明
  try {
    execSync('tsc --emitDeclarationOnly --outDir dist/types', { stdio: 'inherit' });
  } catch (e) {
    console.warn('TypeScript declaration generation failed:', e.message);
  }

  // 4. 生成package.json用于发布
  const pkg = {
    name: 'lite-game-engine',
    version: '0.2.0',
    description: '轻量级通用 2D 游戏引擎 (TypeScript + Canvas 2D)',
    main: './index.cjs',
    module: './index.mjs',
    types: '../types/index.d.ts',
    exports: {
      '.': {
        import: './index.mjs',
        require: './index.cjs',
        types: '../types/index.d.ts'
      }
    },
    files: ['*.mjs', '*.cjs', '*.map', '../types'],
    keywords: ['game-engine', '2d', 'canvas', 'typescript'],
    license: 'MIT'
  };

  writeFileSync('dist/lib/package.json', JSON.stringify(pkg, null, 2));

  console.log('[build] Library build done -> dist/lib/');
  console.log('  - ESM: dist/lib/index.mjs');
  console.log('  - CJS: dist/lib/index.cjs');
  console.log('  - Types: dist/types/');
}

run();