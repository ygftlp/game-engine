// esbuild 构建脚本：把 game-kit（src/）打成可被外部项目引用的库格式。
// 产物：dist/lib/index.mjs + index.cjs、dist/types/** 类型声明、dist/lib/package.json。
// 构建前先清 dist，避免旧产物（如已冻结引擎的类型）混入。
import { build } from 'esbuild';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { execSync } from 'node:child_process';

const libConfig = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'neutral',
  target: ['es2019'],
  sourcemap: true,
  minify: false,
  external: [],
  define: {
    __DEV__: 'false',
    __APP_ENV__: '"production"'
  }
};

async function run() {
  rmSync('dist', { recursive: true, force: true });
  mkdirSync('dist/lib', { recursive: true });
  mkdirSync('dist/types', { recursive: true });

  await build({ ...libConfig, outfile: 'dist/lib/index.mjs', format: 'esm' });
  await build({ ...libConfig, outfile: 'dist/lib/index.cjs', format: 'cjs' });

  // 类型声明：rootDir=src 时 tsc 直接产出 dist/types/index.d.ts。
  // 失败必须让构建失败，禁止产出缺类型的包。
  execSync('tsc --declaration --emitDeclarationOnly --outDir dist/types', { stdio: 'inherit' });

  const pkg = {
    name: 'game-kit',
    version: '0.1.0',
    description: '无头游戏逻辑组件库（纯 TypeScript、零平台依赖）',
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
    keywords: ['game', 'components', 'typescript', 'headless'],
    license: 'MIT'
  };
  writeFileSync('dist/lib/package.json', JSON.stringify(pkg, null, 2));

  console.log('[build] game-kit library build done -> dist/lib/');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
