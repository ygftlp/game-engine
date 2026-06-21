---
name: gamex-engine
description: >
  GameX Engine (lite-game-engine) AI development skill. Lightweight 2D game engine 
  (TypeScript + Canvas 2D) supporting WeChat/Douyin/H5 mini-games. Use when user 
  mentions game development, gamex, mini-game, Canvas game, 2D game, WeChat game, 
  Douyin game, H5 game, or asks about game engine APIs, Scene, Node, Sprite, Input, 
  Collision, Platform, UI components, or game architecture.
---

# GameX Engine Skill

> AI 游戏开发技能包：为 AI 助手提供 GameX Engine 的完整开发能力。

## 项目位置

Skill 位于项目 `skills/gamex-engine/` 目录下，可被多种AI工具引用：
- MiMoCode: `C:\Users\yangg\.codex\skills\gamex-engine\`
- Claude Code: 项目内 `skills/gamex-engine/`
- 其他AI: 直接引用 `skills/gamex-engine/SKILL.md`

## 引擎概述

轻量级 2D 游戏引擎（TypeScript + Canvas 2D），**一套代码同时支持微信/抖音/H5三端**。

```
语言: TypeScript
渲染: Canvas 2D
平台: 微信小游戏 / 抖音小游戏 / H5 浏览器
构建: esbuild
```

## 三层架构

| 层级 | 说明 | 示例 |
|------|------|------|
| **引擎核心层** | 平台无关，只依赖 `IPlatform` | `Engine`, `Node`, `Scene`, `Renderer` |
| **平台适配层** | 实现 `IPlatform` 接口 | `WxPlatform`, `TtPlatform`, `H5Platform` |
| **游戏层** | 用引擎 API 编写游戏逻辑 | 自定义 `Scene` 子类 |

## 快速启动

```typescript
import { Engine, Scene, WxPlatform, Sprite, Node } from 'game-engine';

class GameScene extends Scene {
  private player!: Sprite;

  onEnter(): void {
    this.player = new Sprite();
    this.player.width = 32;
    this.player.height = 32;
    this.addChild(this.player);
  }

  update(dt: number): void {
    this.player.x += 100 * dt;
  }
}

const engine = new Engine(new WxPlatform());
engine.setScene(new GameScene());
engine.start();
```

## 导入方式

```typescript
import {
  // 核心
  Engine, Scene, Node, Ticker,
  // 渲染
  Renderer, Sprite, Texture, TextNode,
  // 输入
  Input, TouchPoint,
  // 资源
  Loader,
  // 音频
  Audio,
  // 碰撞
  Collision, Rect, Circle,
  // 数学
  Vec2,
  // 平台
  WxPlatform, TtPlatform, H5Platform,
  // 类型
  IPlatform
} from 'game-engine';
```

---

## 核心 API 速查

### Engine 引擎主控制器

```typescript
class Engine {
  readonly renderer: Renderer;
  readonly input: Input;
  readonly loader: Loader;
  readonly width: number;
  readonly height: number;
  readonly platform: IPlatform;

  constructor(platform: IPlatform);
  setScene(scene: Scene): void;
  start(): void;
}
```

### Scene 场景

```typescript
class Scene extends Node {
  onEnter(): void;        // 场景进入时调用
  onExit(): void;         // 场景退出时调用
  update(dt: number): void;
}
```

### Node 节点

```typescript
class Node {
  x: number; y: number;
  rotation: number;       // 弧度
  scaleX: number; scaleY: number;
  visible: boolean;
  alpha: number;          // 0-1
  zIndex: number;         // 绘制顺序
  width: number; height: number;
  anchorX: number; anchorY: number;  // 0-1

  addChild(child: Node): Node;
  removeChild(child: Node): void;
  addComponent<T>(component: T): T;
  getComponent<T>(type: new () => T): T | null;
  hitTest(worldX: number, worldY: number): Node | null;
}
```

### Sprite 精灵

```typescript
class Sprite extends Node {
  texture: Texture | null;
  frame: TextureFrame | null;

  constructor(texture?: Texture | null);
  setTexture(texture: Texture, frame?: TextureFrame | null): void;
  setFrame(frame: TextureFrame): void;
}
```

### Input 输入

```typescript
class Input {
  onStart(fn: (touches: TouchPoint[]) => void): void;
  onMove(fn: (touches: TouchPoint[]) => void): void;
  onEnd(fn: (touches: TouchPoint[]) => void): void;
}

interface TouchPoint { id: number; x: number; y: number; }
```

### Loader 资源加载

```typescript
class Loader {
  loadTexture(url: string): Promise<Texture>;
  loadAudio(url: string): Audio;
  loadJSON(url: string): Promise<unknown>;
}
```

### Audio 音频

```typescript
class Audio {
  load(url: string): void;
  play(loop?: boolean): void;
  pause(): void;
  stop(): void;
  volume: number;
  destroy(): void;
}
```

### Collision 碰撞检测

```typescript
class Collision {
  static rectIntersect(a: Rect, b: Rect): boolean;
  static circleIntersect(a: Circle, b: Circle): boolean;
  static pointInRect(px: number, py: number, r: Rect): boolean;
}

interface Rect { x: number; y: number; width: number; height: number; }
interface Circle { x: number; y: number; radius: number; }
```

### Component 组件

```typescript
abstract class Component {
  node: Node;
  enabled: boolean;
  onAttach(): void;
  onUpdate(dt: number): void;
  onDetach(): void;
}
```

### Pool 对象池

```typescript
class Pool<T> {
  constructor(factory: () => T, reset: (obj: T) => void, maxSize?: number);
  acquire(): T;
  release(obj: T): void;
  warmUp(count: number): void;
}
```

### SceneManager 场景管理

```typescript
class SceneManager {
  current(): Scene | null;
  push(scene: Scene): void;
  pop(): Scene | null;
  replace(scene: Scene): void;
}
```

---

## 文件结构

```
game-engine/src/engine/
├── core/              # Node, Scene, Component, EventEmitter, Pool, SceneManager
├── render/            # Renderer, Sprite, Texture, TextNode, Animator, AnimationClip
├── ui/                # UIManager, Button, Label, Panel, Joystick, ProgressBar, ScrollView
├── audio/             # Audio, AudioManager, SpatialAudio, AudioEffects
├── collision/         # Collision, SpatialGrid
├── math/              # Vec2, Matrix2D, Mat4
├── physics/           # Physics
├── effects/           # Particle, EnhancedParticle, Tween
├── animation/         # SkeletalAnimation
├── network/           # WebSocket, HttpClient, StateSync, LagCompensation
├── game/              # GameState, InputMapping, SaveSystem, ScoreSystem
├── platform/          # IPlatform, WxPlatform, TtPlatform, H5Platform
├── input/             # Input
├── loader/            # Loader
├── tilemap/           # Tilemap
├── utils/             # Logger, Timer, LRUCache, MathUtils, Storage, PerformanceMonitor
└── index.ts           # 统一导出入口
```

---

## 常见模式

### 游戏主循环

```typescript
class GameScene extends Scene {
  private player!: Sprite;
  private joystick!: Joystick;

  onEnter(): void {
    // 加载资源
    const tex = engine.loader.loadTexture('hero.png');
    this.player = new Sprite(tex);
    this.addChild(this.player);

    // 添加输入
    engine.input.onStart((touches) => {
      const t = touches[0];
      this.player.x = t.x;
      this.player.y = t.y;
    });
  }

  update(dt: number): void {
    // 游戏逻辑
  }
}
```

### 组件化开发

```typescript
class MoveComponent extends Component {
  speed = 100;

  onUpdate(dt: number): void {
    this.node.x += this.speed * dt;
  }
}

const sprite = new Sprite(texture);
sprite.addComponent(new MoveComponent());
```

### 对象池复用

```typescript
const bulletPool = new Pool<Bullet>(
  () => ({ x: 0, y: 0, active: false }),
  (b) => { b.x = 0; b.y = 0; b.active = false; },
  100
);

// 使用
const bullet = bulletPool.acquire();
bullet.x = player.x;
bullet.active = true;

// 归还
bulletPool.release(bullet);
```

### 碰撞检测

```typescript
update(dt: number): void {
  const playerRect = { x: player.x, y: player.y, width: 32, height: 32 };
  const enemyRect = { x: enemy.x, y: enemy.y, width: 32, height: 32 };

  if (Collision.rectIntersect(playerRect, enemyRect)) {
    console.log('碰撞！');
  }
}
```

### UI 按钮

```typescript
const button = new Button(100, 200, 150, 50, '开始游戏');
button.onClick = () => {
  engine.setScene(new GameScene());
};
this.addChild(button);
```

### 虚拟摇杆

```typescript
const joystick = new Joystick(150, 500, 60);
this.addChild(joystick);

update(dt: number): void {
  if (joystick.active) {
    player.x += joystick.dx * 100 * dt;
    player.y += joystick.dy * 100 * dt;
  }
}
```

### 补间动画

```typescript
Tween.to(sprite, { x: 400, y: 300 }, 1.0);
```

### 场景切换

```typescript
const sceneManager = new SceneManager();
sceneManager.push(new MenuScene());
sceneManager.push(new GameScene());
sceneManager.pop();
```

### 事件通信

```typescript
const emitter = new EventEmitter();
emitter.on('score:change', (newScore) => {
  label.text = `Score: ${newScore}`;
});
emitter.emit('score:change', 100);
```

---

## 注意事项

1. **平台适配**：使用 `IPlatform` 接口，不要直接调用 `wx`/`tt`/`document`
2. **坐标系**：输入坐标已自动转换为引擎坐标（考虑画布缩放）
3. **性能**：大量 Sprite 考虑使用对象池复用
4. **内存**：及时移除不再使用的节点和组件
5. **构建**：`npm run build` 输出到 `dist/{wechat,douyin,h5}`

---

## 详细 API 参考

- [API-Reference.md](./API-Reference.md) - 完整API文档
- [docs/API.md](../docs/API.md) - 详细API使用手册（含每个函数签名）
