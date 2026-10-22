# 基础使用教程

## 教程目标

本教程将创建一个“点击屏幕生成星星、自动旋转并显示 HUD 文本”的 2D 示例场景。示例项目位于 `examples/manual-starter`。

## 1. 创建场景类

在 `examples/manual-starter/src/StarterScene.ts` 中创建场景：

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

## 2. 在入口中启动引擎

在 `examples/manual-starter/src/main.ts` 中创建启动逻辑：

```ts
import { Engine, H5Platform, Input } from '../../../src/engine';
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

## 3. 导入资源

如果需要纹理或配置文件，可以通过 `Loader` 导入：

```ts
const texture = await engine.loader.loadTexture('assets/player.png');
const config = await engine.loader.loadJSON<{ speed: number }>('assets/config.json');
const bgm = engine.loader.loadAudio('assets/bgm.mp3');
bgm.play(true);
```

建议做法：

- 游戏启动阶段使用 `loadAll()` 并显示加载进度
- 关卡结束后主动调用 `unloadTexture()` 或 `unloadAll()`

## 4. 设置光照与材质

当前引擎为 2D Canvas 渲染，没有 3D 光照或材质系统。可用替代手段如下：

- 用渐变、阴影、透明度模拟高光与暗部
- 用多层 Sprite 或节点叠加模拟光效
- 在 `draw()` 中按顺序绘制背景、角色、前景和 HUD

示例：

```ts
const gradient = renderer.ctx.createLinearGradient(0, 0, 0, 300);
gradient.addColorStop(0, '#5bc0ff');
gradient.addColorStop(1, '#0d2036');
renderer.ctx.fillStyle = gradient;
renderer.ctx.fillRect(0, 0, 400, 300);
```

## 5. 编写逻辑脚本

推荐把游戏逻辑写在 `Scene.update(dt)` 或 `Component.onUpdate(dt)` 中：

```ts
update(dt: number): void {
  super.update(dt);
  this.player.x += this.speed * dt;
  if (this.player.x > 400) {
    this.player.x = 0;
  }
}
```

如果行为需要复用，推荐定义组件：

```ts
class AutoRotate extends Component {
  speed = 1.5;

  onUpdate(dt: number): void {
    this.node.rotation += this.speed * dt;
  }
}
```

## 6. 调试运行

开发态建议开启：

- `npm run watch`
- 调试面板日志
- 浏览器或小游戏控制台

日志示例：

```ts
import { Logger } from '../../../src/engine';

const log = Logger.forModule('Tutorial');
log.info('scene ready');
log.warning('resource fallback enabled');
log.error('failed to load sprite atlas');
```

## 7. 打包发布

### H5

```bash
npm run build
```

将 `dist/h5` 部署到静态 Web 服务器即可。

### 微信小游戏

```bash
npm run build
```

将 `dist/wechat` 导入微信开发者工具，再执行真机预览与提交。

### 抖音小游戏

```bash
npm run build
```

将 `dist/douyin` 导入抖音开发者工具。

## 8. 操作截图说明

当前仓库未内置截图资源，但建议在正式交付或二次维护时补充以下截图：

1. H5 页面启动后的首屏截图
2. 微信开发者工具中的运行截图
3. 调试面板日志叠加截图
4. 构建产物目录截图

截图命名建议：

- `docs/manual/screenshots/zh-CN/tutorial-h5-home.png`
- `docs/manual/screenshots/zh-CN/tutorial-wechat-debug.png`
- `docs/manual/screenshots/zh-CN/tutorial-logger-panel.png`

## 9. 从教程过渡到商业项目

从这个示例走向实际项目时，建议按以下顺序扩展：

1. 用 `Loader.loadAll()` 建立启动加载流程
2. 把通用行为拆成 `Component`
3. 使用 `UIManager` 管理交互控件
4. 用 `Storage` 保存配置、存档和用户进度
5. 用 `Logger` 与平台开发者工具建立问题排查链路
