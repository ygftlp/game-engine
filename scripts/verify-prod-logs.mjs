import { readFileSync } from 'node:fs';

const files = [
  'dist/wechat/game.js',
  'dist/douyin/game.js',
  'dist/h5/game.h5.js'
];

const sentinels = [
  'renderer ready canvas=',
  'requestJSON start url=',
  'requestJSON success url=',
  'rectIntersect received invalid rect'
];

let hasDebugStrings = false;

for (const file of files) {
  const content = readFileSync(file, 'utf8');
  for (const sentinel of sentinels) {
    if (content.includes(sentinel)) {
      console.error(`[verify-prod-logs] found debug string in ${file}: ${sentinel}`);
      hasDebugStrings = true;
    }
  }
}

if (hasDebugStrings) {
  process.exit(1);
}

console.log('[verify-prod-logs] production bundles do not contain debug log sentinels');
