// esbuild 构建脚本：将 TypeScript 源码打包成微信小游戏可用的 game.js
import { build, context } from 'esbuild';

const watch = process.argv.includes('--watch');

const options = {
  entryPoints: ['src/main.ts'],
  bundle: true,
  outfile: 'game.js',
  format: 'iife',
  platform: 'neutral',
  target: ['es2019'],
  minify: !watch,
  sourcemap: watch,
  external: [],
  legalComments: 'none'
};

if (watch) {
  const ctx = await context(options);
  await ctx.watch();
  console.log('[esbuild] watching...');
} else {
  await build(options);
  console.log('[esbuild] build done -> game.js');
}
