// esbuild 构建脚本：为三端（微信 / 抖音 / H5）各生成独立产物。
// 引擎核心与平台无关，每个入口注入不同的适配器。
import { build, context } from 'esbuild';
import { cpSync, mkdirSync } from 'node:fs';

const watch = process.argv.includes('--watch');

// 各端入口与产物：微信/抖音产物为 game.js（放入各自项目目录），H5 为 game.h5.js
const targets = [
  { entry: 'src/entries/main.wx.ts', outfile: 'dist/wechat/game.js' },
  { entry: 'src/entries/main.tt.ts', outfile: 'dist/douyin/game.js' },
  { entry: 'src/entries/main.h5.ts', outfile: 'dist/h5/game.h5.js' }
];

const common = {
  bundle: true,
  format: 'iife',
  platform: 'neutral',
  target: ['es2019'],
  minify: !watch,
  sourcemap: watch,
  legalComments: 'none'
};

async function run() {
  for (const t of targets) {
    const options = { ...common, entryPoints: [t.entry], outfile: t.outfile };
    if (watch) {
      const ctx = await context(options);
      await ctx.watch();
    } else {
      await build(options);
    }
  }
  // H5 需要 index.html
  mkdirSync('dist/h5', { recursive: true });
  cpSync('src/web/index.html', 'dist/h5/index.html');
  console.log(watch ? '[esbuild] watching all targets...' : '[esbuild] build done -> dist/{wechat,douyin,h5}');
}

run();
