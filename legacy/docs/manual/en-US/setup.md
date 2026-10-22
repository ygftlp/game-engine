# Development Setup Guide

## 1. Prerequisites

- Node.js 18 or newer
- npm 9 or newer
- Git
- At least one target platform toolchain

Recommended runtime tools:

- H5: Chrome, Edge, or another modern browser
- WeChat Mini Game: WeChat DevTools
- Douyin Mini Game: Douyin DevTools

## 2. Clone and Install

```bash
git clone <your-repository-url>
cd game-engine
npm install
```

Useful commands after install:

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run example:build
npm run docs:build
```

## 3. Repository Layout

```text
src/engine    engine core
src/entries   target-specific entry files
src/game      demo scenes and game code
src/web       H5 shell page
tests         unit tests
docs/manual   bilingual manual sources
examples      starter example project
scripts       build and validation scripts
dist          generated output
```

## 4. Build Flow

### Production build

```bash
npm run build
```

Outputs:

- `dist/wechat/game.js`
- `dist/douyin/game.js`
- `dist/h5/game.h5.js`
- `dist/h5/index.html`

### Development build

```bash
npm run watch
```

Behavior:

- source maps enabled
- `__DEV__ = true`
- `DEV:` debug labels are preserved

## 5. Dependency Notes

| Dependency | Purpose |
| --- | --- |
| `typescript` | typing and compile-time checks |
| `esbuild` | multi-target bundle build |
| `vitest` | unit testing |
| `eslint` | linting |
| `marked` | HTML doc rendering |
| `pdfkit` | PDF manual generation |

## 6. Project Template Workflow

The engine currently uses a code-first workflow. There is no graphical project wizard. The recommended flow is:

1. Copy `examples/manual-starter`
2. Place your own scene classes under `src/game/`
3. Instantiate `Engine` in one of the `src/entries/main.*.ts` files
4. Inject the correct platform adapter and set the initial scene

Minimal example:

```ts
import { Engine, H5Platform } from '../engine';
import { StarterScene } from '../game/StarterScene';

const engine = new Engine(new H5Platform());
engine.setScene(new StarterScene());
engine.start();
```

## 7. Tool Installation and Launch

### H5

1. Run `npm run build`
2. Serve `dist/h5` with any static file server
3. Open `index.html` in a browser
4. Use browser devtools for performance and console inspection

### WeChat Mini Game

1. Run `npm run build`
2. Import the repository or `dist/wechat` into WeChat DevTools
3. Ensure `game.json` and `project.config.json` are recognized
4. Use device preview, storage tools, and performance panels

### Douyin Mini Game

1. Run `npm run build`
2. Import `dist/douyin` into Douyin DevTools
3. Launch the simulator or device preview
4. Inspect console, storage, and network diagnostics

## 8. Companion Tooling Notes

The original requirement mentioned scene editors, material editors, animation editors, and profiler tools. These are not built into the current repository. Use the following replacements:

| Need | Current approach |
| --- | --- |
| Scene authoring | code-defined node trees and UI |
| Material editing | Canvas colors, gradients, textures, and alpha in code |
| Animation editing | `AnimationClip` and `Animator` configured in code |
| Performance analysis | browser devtools, mini-game devtools, and the engine log panel |

## 9. Documentation Build

```bash
npm run docs:clean
npm run docs:build
```

Outputs:

- `dist/docs/index.html`
- `dist/docs/zh-CN/*.html`
- `dist/docs/en-US/*.html`
- `dist/docs/pdf/zh-CN-manual.pdf`
- `dist/docs/pdf/en-US-manual.pdf`

## 10. Example Build

```bash
npm run example:build
```

Outputs:

- `dist/examples/manual-starter/index.html`
- `dist/examples/manual-starter/main.js`

This example stays aligned with the tutorial and is useful as the smallest end-to-end integration check.

## 11. Recommended Validation

Before shipping, run:

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run example:build
npm run docs:build
```
