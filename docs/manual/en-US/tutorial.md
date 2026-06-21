# Basic Tutorial

## Goal

This tutorial creates a simple 2D scene that spawns rotating stars on tap and renders a lightweight HUD. The companion source lives in `examples/manual-starter`.

## 1. Create a Scene Class

Create `examples/manual-starter/src/StarterScene.ts`:

```ts
import { Scene, Node, Renderer, Logger } from '../../../src/engine';

const tutorialLogger = Logger.forModule('ManualStarter');

interface StarNode extends Node {
  angularSpeed?: number;
}

export class StarterScene extends Scene {
  private stars: StarNode[] = [];
  private elapsed = 0;

  onEnter(): void {
    tutorialLogger.info('starter scene ready');
    this.spawnStar(200, 180, 0);
  }

  update(dt: number): void {
    super.update(dt);
    this.elapsed += dt;
    for (const star of this.stars) {
      star.rotation += (star.angularSpeed ?? 0) * dt;
    }
  }

  spawnStar(x: number, y: number, angularSpeed: number): void {
    const star = new Node() as StarNode;
    star.x = x;
    star.y = y;
    star.width = 36;
    star.height = 36;
    star.angularSpeed = angularSpeed;
    this.stars.push(star);
    this.addChild(star);
  }

  protected draw(renderer: Renderer): void {
    const { ctx } = renderer;
    ctx.fillStyle = '#07111f';
    ctx.fillRect(0, 0, 400, 720);
    ctx.fillStyle = '#cce7ff';
    ctx.font = '24px sans-serif';
    ctx.fillText(`Stars: ${this.stars.length}`, 24, 40);
    ctx.fillText(`Time: ${this.elapsed.toFixed(1)}s`, 24, 72);
  }
}
```

## 2. Start the Engine

Create `examples/manual-starter/src/main.ts`:

```ts
import { Engine, H5Platform } from '../../../src/engine';
import { StarterScene } from './StarterScene';

const engine = new Engine(new H5Platform());
const scene = new StarterScene();

engine.setScene(scene);

engine.input.onStart((touches) => {
  const point = touches[0];
  if (!point) return;
  scene.spawnStar(point.x, point.y, 1 + Math.random() * 2);
});

engine.start();
```

## 3. Import Resources

Use `Loader` for textures, JSON, and audio:

```ts
const texture = await engine.loader.loadTexture('assets/player.png');
const config = await engine.loader.loadJSON<{ speed: number }>('assets/config.json');
const bgm = engine.loader.loadAudio('assets/bgm.mp3');
bgm.play(true);
```

Recommended practice:

- preload startup assets with `loadAll()`
- call `unloadTexture()` or `unloadAll()` when content is no longer needed

## 4. Lighting and Materials

This engine does not include 3D lighting or a material system. For a 2D project, use:

- gradients and alpha layering for depth
- stacked sprites or nodes for glow and highlights
- ordered draw passes for background, gameplay, foreground, and HUD

Example:

```ts
const gradient = renderer.ctx.createLinearGradient(0, 0, 0, 300);
gradient.addColorStop(0, '#5bc0ff');
gradient.addColorStop(1, '#0d2036');
renderer.ctx.fillStyle = gradient;
renderer.ctx.fillRect(0, 0, 400, 300);
```

## 5. Write Gameplay Logic

Gameplay usually lives in `Scene.update(dt)` or `Component.onUpdate(dt)`:

```ts
update(dt: number): void {
  super.update(dt);
  this.player.x += this.speed * dt;
  if (this.player.x > 400) {
    this.player.x = 0;
  }
}
```

Reusable behavior fits well in components:

```ts
class AutoRotate extends Component {
  speed = 1.5;

  onUpdate(dt: number): void {
    this.node.rotation += this.speed * dt;
  }
}
```

## 6. Debug and Run

For development, use:

- `npm run watch`
- the in-engine logger panel
- browser or mini-game consoles

Logging example:

```ts
import { Logger } from '../../../src/engine';

const log = Logger.forModule('Tutorial');
log.info('scene ready');
log.warning('resource fallback enabled');
log.error('failed to load sprite atlas');
```

## 7. Package and Release

### H5

```bash
npm run build
```

Deploy `dist/h5` to any static web server.

### WeChat Mini Game

```bash
npm run build
```

Import `dist/wechat` into WeChat DevTools and follow the preview/publish flow.

### Douyin Mini Game

```bash
npm run build
```

Import `dist/douyin` into Douyin DevTools.

## 8. Screenshot Guidance

The repository does not ship tutorial screenshots, but the recommended capture set is:

1. H5 first frame
2. WeChat DevTools running view
3. Logger overlay panel
4. Built output folder view

Suggested file names:

- `docs/manual/screenshots/en-US/tutorial-h5-home.png`
- `docs/manual/screenshots/en-US/tutorial-wechat-debug.png`
- `docs/manual/screenshots/en-US/tutorial-logger-panel.png`

## 9. Next Steps Toward Production

To evolve the sample into a commercial project:

1. build a startup preload flow with `Loader.loadAll()`
2. extract repeated behavior into `Component` classes
3. manage interface widgets through `UIManager`
4. persist progress through `Storage`
5. combine `Logger` with platform devtools for diagnostics
