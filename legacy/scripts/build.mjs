// esbuild 构建脚本：为三端（微信 / 抖音 / H5）各生成独立产物。
// 引擎核心与平台无关，每个入口注入不同的适配器。
import { build, context } from 'esbuild';
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

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
  legalComments: 'none',
  define: {
    __DEV__: watch ? 'true' : 'false',
    __APP_ENV__: watch ? '"development"' : '"production"'
  }
};

function copyIfExists(source, target) {
  if (!existsSync(source)) return;
  mkdirSync(dirname(target), { recursive: true });
  cpSync(source, target);
}

function copyPlatformProjectFiles() {
  copyIfExists('game.json', 'dist/wechat/game.json');
  copyIfExists('project.config.json', 'dist/wechat/project.config.json');

  // 抖音小游戏同样需要 game.json 作为基础入口配置；若后续存在专用配置，可替换为平台专属文件。
  copyIfExists('game.json', 'dist/douyin/game.json');
}

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

  // H5 需要 index.html；小游戏端需要可直接导入开发者工具的配置文件。
  mkdirSync('dist/h5', { recursive: true });
  cpSync('src/web/index.html', 'dist/h5/index.html');
  copyPlatformProjectFiles();

  console.log(watch ? '[esbuild] watching all targets...' : '[esbuild] build done -> dist/{wechat,douyin,h5}');
}

run();
