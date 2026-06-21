# lite-game-engine API 使用手册

> 轻量级通用 2D 游戏引擎（TypeScript + Canvas 2D），一套代码同时支持**微信小游戏 / 抖音小游戏 / H5**三端。

## 目录

- [快速开始](#快速开始)
- [引擎核心](#引擎核心)
  - [Engine](#engine)
  - [Scene](#scene)
  - [Node](#node)
  - [Ticker](#ticker)
- [渲染系统](#渲染系统)
  - [Renderer](#renderer)
  - [Sprite](#sprite)
  - [Texture](#texture)
  - [TextNode](#textnode)
- [输入系统](#输入系统)
  - [Input](#input)
- [资源管理](#资源管理)
  - [Loader](#loader)
- [音频系统](#音频系统)
  - [Audio](#audio)
- [碰撞检测](#碰撞检测)
  - [Collision](#collision)
- [数学工具](#数学工具)
  - [Vec2](#vec2)
  - [Matrix2D](#matrix2d)
- [平台适配](#平台适配)
  - [IPlatform 接口](#iplatform-接口)
  - [WxPlatform](#wxplatform)
  - [TtPlatform](#ttplatform)
  - [H5Platform](#h5platform)
- [事件系统](#事件系统)
  - [EventEmitter](#eventemitter)
  - [EnhancedEventEmitter](#enhancedeventemitter)
  - [TypedEventEmitter](#typedeventemitter)
- [组件系统](#组件系统)
  - [Component](#component)
- [对象池](#对象池)
  - [Pool](#pool)
- [场景管理](#场景管理)
  - [SceneManager](#scenemanager)
- [UI 组件](#ui-组件)
  - [UIManager](#uimanager)
  - [UIWidget](#uiwidget)
  - [Button](#button)
  - [Label](#label)
  - [Panel](#panel)
  - [Joystick](#joystick)
  - [ProgressBar](#progressbar)
  - [ScrollView](#scrollview)
  - [Slider](#slider)
  - [Toggle](#toggle)
  - [Toast](#toast)
  - [Dialog](#dialog)
  - [HealthBar](#healthbar)
  - [LayoutContainer](#layoutcontainer)
  - [FlexLayout](#flexlayout)
  - [ConstraintLayout](#constraintlayout)
  - [UILayout](#uilayout)
- [动画系统](#动画系统)
  - [Animator](#animator)
  - [AnimationClip](#animationclip)
  - [SkeletalAnimation](#skeletalanimation)
- [特效系统](#特效系统)
  - [Particle](#particle)
  - [EnhancedParticle](#enhancedparticle)
  - [Tween](#tween)
- [游戏系统](#游戏系统)
  - [GameState](#gamestate)
  - [InputMapping](#inputmapping)
  - [SaveSystem](#savesystem)
  - [ScoreSystem](#scoresystem)
- [物理系统](#物理系统)
  - [Physics](#physics)
- [Tilemap](#tilemap)
- [网络系统](#网络系统)
  - [WebSocket](#websocket)
  - [HttpClient](#httpclient)
  - [StateSync](#statesync)
  - [LagCompensation](#lagcompensation)
- [工具类](#工具类)
  - [Logger](#logger)
  - [Timer](#timer)
  - [LRUCache](#lrucache)
  - [MathUtils](#mathutils)
  - [Storage](#storage)
  - [PerformanceMonitor](#performancemonitor)
  - [ErrorHandler](#errorhandler)
  - [ErrorTracker](#errortracker)
  - [ScreenAdapter](#screenadapter)
  - [ResolutionScaler](#resolutionscaler)

---

## 快速开始

### 安装与构建

```bash
npm install
npm run build      # 输出 dist/{wechat,douyin,h5}
npm run typecheck  # 类型检查
```

### 最小示例

```typescript
import { Engine, Scene, WxPlatform } from 'game-engine';

class MyScene extends Scene {
  onEnter(): void {
    console.log('游戏开始');
  }
}

const engine = new Engine(new WxPlatform());
engine.setScene(new MyScene());
engine.start();
```

### 三层架构

| 层级 | 说明 | 示例 |
|------|------|------|
| **引擎核心层** | 平台无关，只依赖 `IPlatform` | `Engine`, `Node`, `Scene`, `Renderer` |
| **平台适配层** | 实现 `IPlatform` 接口 | `WxPlatform`, `TtPlatform`, `H5Platform` |
| **游戏层** | 用引擎 API 编写游戏逻辑 | 自定义 `Scene` 子类 |

---

## 引擎核心

### Engine

引擎主控制器，通过依赖注入接收 `IPlatform`，与具体平台完全解耦。

```typescript
class Engine {
  readonly renderer: Renderer;
  readonly input: Input;
  readonly loader: Loader;
  readonly width: number;      // 画布宽度（物理像素）
  readonly height: number;     // 画布高度（物理像素）
  readonly platform: IPlatform;

  constructor(platform: IPlatform);
  setScene(scene: Scene): void;
  start(): void;
}
```

**参数说明：**

| 参数 | 类型 | 说明 |
|------|------|------|
| `platform` | `IPlatform` | 平台适配器实例（`WxPlatform` / `TtPlatform` / `H5Platform`） |

**方法：**

- `setScene(scene)` — 设置当前场景，替换后引擎自动驱动该场景的 `update` 和 `visit`
- `start()` — 启动游戏主循环（Ticker）

---

### Scene

场景基类，继承自 `Node`，是节点树的根容器。

```typescript
class Scene extends Node {
  onEnter(): void;   // 场景被设为当前场景时调用
  onExit(): void;    // 场景退出时调用
  update(dt: number): void;  // 每帧逻辑更新（dt 为秒）
}
```

**使用方式：**

```typescript
class GameScene extends Scene {
  private player!: Sprite;

  onEnter(): void {
    this.player = new Sprite();
    this.addChild(this.player);
  }

  update(dt: number): void {
    super.update(dt);
    this.player.x += 100 * dt;
  }
}
```

---

### Node

节点基类，支持树状结构、变换（位置/旋转/缩放）、组件挂载、命中检测。

```typescript
class Node {
  x: number;          // 本地 X 坐标
  y: number;          // 本地 Y 坐标
  rotation: number;   // 旋转角度（弧度）
  scaleX: number;     // X 缩放
  scaleY: number;     // Y 缩放
  visible: boolean;   // 是否可见
  alpha: number;      // 透明度 0-1
  zIndex: number;     // 绘制/命中顺序（大者在上）
  width: number;      // 包围盒宽度
  height: number;     // 包围盒高度
  anchorX: number;    // 锚点 X（0-1，默认 0.5）
  anchorY: number;    // 锚点 Y（0-1，默认 0.5）

  parent: Node | null;
  readonly children: Node[];
  readonly components: Component[];
  readonly worldMatrix: Matrix2D;

  addChild(child: Node): Node;
  removeChild(child: Node): void;
  removeFromParent(): void;
  addComponent<T extends Component>(component: T): T;
  getComponent<T extends Component>(type: new (...args: never[]) => T): T | null;
  removeComponent(component: Component): void;
  update(dt: number): void;
  hitTest(worldX: number, worldY: number): Node | null;
}
```

**方法说明：**

| 方法 | 返回值 | 说明 |
|------|--------|------|
| `addChild(child)` | `Node` | 添加子节点，自动移除旧父节点 |
| `removeChild(child)` | `void` | 移除子节点 |
| `removeFromParent()` | `void` | 从父节点移除自身 |
| `addComponent<T>(component)` | `T` | 挂载组件，自动调用 `onAttach()` |
| `getComponent<T>(type)` | `T \| null` | 获取指定类型的组件 |
| `removeComponent(component)` | `void` | 移除组件，自动调用 `onDetach()` |
| `update(dt)` | `void` | 递归更新：驱动组件 `onUpdate` 和子节点 |
| `hitTest(worldX, worldY)` | `Node \| null` | 世界坐标命中检测（考虑 zIndex） |

---

### Ticker

游戏主循环，基于平台 `requestAnimationFrame`，采用**固定时间步长**（1/60s）更新。

```typescript
class Ticker {
  start(): void;
  stop(): void;
}
```

**特性：**
- 固定步长 1/60 秒，update 与 render 分离
- 自动跳帧：单帧超过 0.25s 时截断
- 由 `Engine` 内部创建和管理

---

## 渲染系统

### Renderer

封装 Canvas 2D context，提供清屏与基础绘制能力。

```typescript
class Renderer {
  readonly ctx: CanvasRenderingContext2D;
  readonly width: number;
  readonly height: number;

  constructor(canvas: ICanvas, width: number, height: number);
  clear(color?: string): void;
  drawRect(x: number, y: number, w: number, h: number, color: string): void;
  drawText(text: string, x: number, y: number, color: string, font?: string): void;
}
```

| 方法 | 说明 |
|------|------|
| `clear(color)` | 清屏并重置变换（默认 `'#000000'`） |
| `drawRect(x, y, w, h, color)` | 绘制填充矩形 |
| `drawText(text, x, y, color, font)` | 绘制文本（默认 `'16px sans-serif'`） |

---

### Sprite

可显示纹理的节点，支持图集子区域（frame）绘制。

```typescript
class Sprite extends Node {
  frame: TextureFrame | null;
  texture: Texture | null;

  constructor(texture?: Texture | null);
  setTexture(texture: Texture, frame?: TextureFrame | null): void;
  setFrame(frame: TextureFrame): void;
}
```

**示例：**

```typescript
const sprite = new Sprite();
const tex = await loader.loadTexture('hero.png');
sprite.setTexture(tex);
sprite.x = 100;
sprite.y = 200;
this.addChild(sprite);
```

**图集子区域绘制：**

```typescript
const frame: TextureFrame = { x: 0, y: 0, width: 64, height: 64 };
sprite.setTexture(atlasTexture, frame);
```

---

### Texture

纹理类，包装平台图片对象，记录尺寸。

```typescript
class Texture {
  readonly image: IImage;
  readonly width: number;
  readonly height: number;

  constructor(image: IImage);
}
```

**TextureFrame 接口：**

```typescript
interface TextureFrame {
  x: number;       // 图集中 X 偏移
  y: number;       // 图集中 Y 偏移
  width: number;   // 子区域宽度
  height: number;  // 子区域高度
}
```

---

### TextNode

文本节点，在节点树中绘制文本。

```typescript
class TextNode extends Node {
  text: string;
  color: string;
  font: string;
  align: TextAlign;  // 'left' | 'center' | 'right'

  constructor(text?: string, color?: string, font?: string, align?: TextAlign);
}
```

**示例：**

```typescript
const label = new TextNode('Hello', '#fff', '24px sans-serif', 'center');
label.x = 375;
label.y = 100;
this.addChild(label);
```

---

## 输入系统

### Input

输入系统，封装平台指针事件，转换为引擎内坐标（考虑画布缩放比）。

```typescript
class Input {
  onStart(fn: InputListener): void;
  onMove(fn: InputListener): void;
  onEnd(fn: InputListener): void;
}
```

**类型定义：**

```typescript
interface TouchPoint {
  id: number;   // 触点标识
  x: number;    // 引擎坐标 X
  y: number;    // 引擎坐标 Y
}

type InputListener = (touches: TouchPoint[]) => void;
```

**示例：**

```typescript
engine.input.onStart((touches) => {
  const touch = touches[0];
  console.log(`触摸开始: (${touch.x}, ${touch.y})`);
});

engine.input.onMove((touches) => {
  const touch = touches[0];
  player.x = touch.x;
  player.y = touch.y;
});

engine.input.onEnd(() => {
  console.log('触摸结束');
});
```

---

## 资源管理

### Loader

资源管理器，支持图片、音频、JSON 的异步加载与缓存。

```typescript
class Loader {
  loadTexture(url: string): Promise<Texture>;
  loadAudio(url: string): Audio;
  loadJSON(url: string): Promise<unknown>;
}
```

| 方法 | 说明 |
|------|------|
| `loadTexture(url)` | 加载图片为 Texture（自动缓存，重复请求返回缓存） |
| `loadAudio(url)` | 加载音频为 Audio 对象 |
| `loadJSON(url)` | 加载 JSON 数据（自动缓存） |

**示例：**

```typescript
// 加载纹理
const tex = await engine.loader.loadTexture('assets/hero.png');

// 加载 JSON
const config = await engine.loader.loadJSON('data/config.json') as GameConfig;

// 加载音频
const bgm = engine.loader.loadAudio('audio/bgm.mp3');
bgm.play(true); // 循环播放
```

---

## 音频系统

### Audio

音频播放控制器，封装平台音频 API。

```typescript
class Audio {
  load(url: string): void;
  play(loop?: boolean): void;
  pause(): void;
  stop(): void;
  volume: number;       // 音量 0-1（setter）
  destroy(): void;
}
```

| 方法 | 说明 |
|------|------|
| `load(url)` | 设置音频源 |
| `play(loop)` | 播放（`loop=true` 循环播放） |
| `pause()` | 暂停 |
| `stop()` | 停止 |
| `destroy()` | 销毁音频上下文 |

---

## 碰撞检测

### Collision

静态碰撞检测工具类。

```typescript
class Collision {
  static rectIntersect(a: Rect, b: Rect): boolean;
  static circleIntersect(a: Circle, b: Circle): boolean;
  static pointInRect(px: number, py: number, r: Rect): boolean;
}
```

**类型定义：**

```typescript
interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Circle {
  x: number;
  y: number;
  radius: number;
}
```

**示例：**

```typescript
// AABB 矩形碰撞
const playerRect = { x: player.x, y: player.y, width: 32, height: 32 };
const enemyRect = { x: enemy.x, y: enemy.y, width: 32, height: 32 };
if (Collision.rectIntersect(playerRect, enemyRect)) {
  console.log('碰撞发生！');
}

// 圆形碰撞
const circleA = { x: 100, y: 100, radius: 20 };
const circleB = { x: 130, y: 100, radius: 20 };
if (Collision.circleIntersect(circleA, circleB)) {
  console.log('圆形碰撞！');
}

// 点在矩形内
if (Collision.pointInRect(mouseX, mouseY, buttonRect)) {
  console.log('点击了按钮');
}
```

---

## 数学工具

### Vec2

二维向量，用于位置、速度等计算。

```typescript
class Vec2 {
  x: number;
  y: number;

  constructor(x?: number, y?: number);
  set(x: number, y: number): this;
  add(v: Vec2): Vec2;
  clone(): Vec2;
}
```

---

### Matrix2D

2D 仿射变换矩阵（a c e / b d f / 0 0 1）。

```typescript
class Matrix2D {
  a: number;  // 水平缩放
  b: number;  // 垂直倾斜
  c: number;  // 水平倾斜
  d: number;  // 垂直缩放
  e: number;  // 水平平移
  f: number;  // 垂直平移

  constructor(a?, b?, c?, d?, e?, f?);
  identity(): this;
  applyTransform(x: number, y: number, rotation: number, scaleX: number, scaleY: number): this;
  clone(): Matrix2D;
  invertPoint(x: number, y: number): { x: number; y: number };
}
```

| 方法 | 说明 |
|------|------|
| `identity()` | 重置为单位矩阵 |
| `applyTransform(x, y, rotation, scaleX, scaleY)` | 依次应用平移、旋转、缩放 |
| `clone()` | 深拷贝矩阵 |
| `invertPoint(x, y)` | 将世界坐标反变换为局部坐标 |

---

## 平台适配

### IPlatform 接口

引擎核心只依赖此接口，绝不出现 `wx` / `tt` / `document` 等平台全局对象。

```typescript
interface IPlatform {
  readonly name: string;
  createCanvas(): ICanvas;
  createImage(): IImage;
  createAudio(): IAudio;
  getScreenInfo(): ScreenInfo;
  onPointerStart(handler: PointerHandler): void;
  onPointerMove(handler: PointerHandler): void;
  onPointerEnd(handler: PointerHandler): void;
  requestJSON(url: string): Promise<unknown>;
  requestAnimationFrame(cb: (time: number) => void): number;
}
```

**相关类型：**

```typescript
interface ICanvas {
  width: number;
  height: number;
  getContext(type: '2d'): CanvasRenderingContext2D;
}

interface IImage {
  src: string;
  width: number;
  height: number;
  onload: (() => void) | null;
  onerror: ((err: unknown) => void) | null;
}

interface IAudio {
  src: string;
  loop: boolean;
  volume: number;
  play(): void;
  pause(): void;
  stop(): void;
  destroy(): void;
}

interface ScreenInfo {
  width: number;
  height: number;
  pixelRatio: number;
}

interface PointerPoint {
  id: number;
  x: number;
  y: number;
}

type PointerHandler = (points: PointerPoint[]) => void;
```

### WxPlatform

微信小游戏平台适配器。

```typescript
class WxPlatform implements IPlatform {
  readonly name = 'wechat';
}
```

### TtPlatform

抖音小游戏平台适配器。

```typescript
class TtPlatform implements IPlatform {
  readonly name = 'douyin';
}
```

### H5Platform

H5 浏览器平台适配器。

```typescript
class H5Platform implements IPlatform {
  readonly name = 'h5';
}
```

**平台选择示例：**

```typescript
// 微信小游戏
import { WxPlatform } from 'game-engine';
const engine = new Engine(new WxPlatform());

// 抖音小游戏
import { TtPlatform } from 'game-engine';
const engine = new Engine(new TtPlatform());

// H5 浏览器
import { H5Platform } from 'game-engine';
const engine = new Engine(new H5Platform());
```

---

## 事件系统

### EventEmitter

全局事件发射器，支持 on/off/emit/once。

```typescript
class EventEmitter {
  on(event: string, listener: EventListener): this;
  once(event: string, listener: EventListener): this;
  off(event: string, listener: EventListener): this;
  offAll(event: string): this;
  clear(): this;
  emit(event: string, ...args: unknown[]): this;
  listenerCount(event: string): number;
  hasListeners(event: string): boolean;
}
```

---

### EnhancedEventEmitter

增强事件系统，支持优先级、命名空间、条件监听、事件拦截。

```typescript
class EnhancedEventEmitter {
  on(event: string, callback: (...args: unknown[]) => void, options?: EventListenerOptions): () => void;
  once(event: string, callback: (...args: unknown[]) => void, options?: EventListenerOptions): () => void;
  onCondition(event: string, callback: (...args: unknown[]) => void, condition: () => boolean): () => void;
  onNamespace(namespace: string, event: string, callback: (...args: unknown[]) => void): () => void;
  off(event: string, callback?: (...args: unknown[]) => void): this;
  offNamespace(namespace: string): this;
  offAll(event: string): this;
  clear(): this;
  addInterceptor(interceptor: EventInterceptor): () => void;
  removeInterceptor(interceptor: EventInterceptor): void;
  emit(event: string, ...args: unknown[]): boolean;
  emitAsync(event: string, ...args: unknown[]): Promise<boolean>;
  listenerCount(event: string): number;
  hasListeners(event: string): boolean;
  getHistory(event?: string): Array<{ event: string; args: unknown[]; timestamp: number }>;
  clearHistory(): void;
  setListenerDisabled(event: string, callback: (...args: unknown[]) => void, disabled: boolean): void;
  getEventNames(): string[];
  isEmitting(): boolean;
}
```

**EventListenerOptions：**

```typescript
interface EventListenerOptions {
  priority?: number;        // 优先级（数字越大越先执行）
  namespace?: string;       // 命名空间（用于批量操作）
  context?: unknown;        // 上下文绑定
  condition?: () => boolean; // 条件监听（不满足时自动移除）
  maxTimes?: number;        // 最大触发次数（0=无限）
  once?: boolean;           // 触发后自动移除
}
```

---

### TypedEventEmitter

类型安全的事件发射器。

```typescript
class TypedEventEmitter<T extends Record<string, unknown[]>> {
  on<K extends keyof T>(event: K, callback: (...args: T[K]) => void, options?: EventListenerOptions): () => void;
  once<K extends keyof T>(event: K, callback: (...args: T[K]) => void, options?: EventListenerOptions): () => void;
  off<K extends keyof T>(event: K, callback?: (...args: T[K]) => void): this;
  emit<K extends keyof T>(event: K, ...args: T[K]): boolean;
  emitAsync<K extends keyof T>(event: K, ...args: T[K]): Promise<boolean>;
  listenerCount<K extends keyof T>(event: K): number;
  hasListeners<K extends keyof T>(event: K): boolean;
  clear(): this;
}
```

**示例：**

```typescript
interface GameEvents {
  'player:hit': [damage: number, source: string];
  'player:die': [];
  'score:change': [newScore: number];
}

const emitter = new TypedEventEmitter<GameEvents>();
emitter.on('player:hit', (damage, source) => {
  console.log(`受到 ${damage} 点伤害，来源: ${source}`);
});
emitter.emit('player:hit', 100, 'enemy');
```

---

## 组件系统

### Component

组件基类，通过挂载到 Node 上复用逻辑（组合优于继承）。

```typescript
abstract class Component {
  node: Node;       // 挂载的宿主节点（由 Node.addComponent 赋值）
  enabled: boolean; // 是否启用

  onAttach(): void;     // 组件被挂载到节点时调用
  onUpdate(dt: number): void;  // 每帧逻辑更新（dt 为秒）
  onDetach(): void;     // 组件从节点移除时调用
}
```

**示例：**

```typescript
class MoveComponent extends Component {
  speed = 100;
  private direction = 1;

  onUpdate(dt: number): void {
    this.node.x += this.speed * this.direction * dt;
    if (this.node.x > 400) this.direction = -1;
    if (this.node.x < 0) this.direction = 1;
  }
}

const sprite = new Sprite(texture);
sprite.addComponent(new MoveComponent());
```

---

## 对象池

### Pool

对象池，复用对象实例，减少 GC 压力。

```typescript
class Pool<T> {
  constructor(
    factory: () => T,
    reset: (obj: T) => void,
    maxSize?: number,     // 池最大容量（0=不限制）
    initialSize?: number  // 初始预分配数量
  );

  acquire(): T;    // 从池中获取对象
  release(obj: T): void;  // 归还对象
  warmUp(count: number): void;  // 预热池
  clear(): void;   // 清空池
  size: number;    // 当前池中对象数量
}
```

**示例：**

```typescript
interface Bullet {
  x: number;
  y: number;
  active: boolean;
}

const bulletPool = new Pool<Bullet>(
  () => ({ x: 0, y: 0, active: false }),
  (b) => { b.x = 0; b.y = 0; b.active = false; },
  100,  // 最大 100 个
  20    // 预分配 20 个
);

// 使用
const bullet = bulletPool.acquire();
bullet.x = player.x;
bullet.y = player.y;
bullet.active = true;

// 归还
bulletPool.release(bullet);
```

---

## 场景管理

### SceneManager

场景栈管理器，支持 push/pop/replace 操作。

```typescript
class SceneManager {
  current(): Scene | null;
  size(): number;
  onChange(callback: SceneChangeCallback): () => void;
  push(scene: Scene): void;
  pop(): Scene | null;
  replace(scene: Scene): void;
  clear(): void;
  getAll(): Scene[];
}
```

| 方法 | 说明 |
|------|------|
| `current()` | 获取当前活跃场景 |
| `size()` | 获取场景栈深度 |
| `onChange(callback)` | 监听场景切换，返回取消函数 |
| `push(scene)` | 压入新场景（当前场景 `onExit`，新场景 `onEnter`） |
| `pop()` | 弹出当前场景（当前 `onExit`，前一个 `onEnter`） |
| `replace(scene)` | 替换当前场景 |
| `clear()` | 清空场景栈 |

**示例：**

```typescript
const sceneManager = new SceneManager();
sceneManager.push(new MenuScene());
sceneManager.push(new GameScene());  // 菜单暂停，游戏进入
sceneManager.pop();                   // 游戏退出，菜单恢复
```

---

## UI 组件

### UIManager

UI 管理器，管理 UI 组件层级和输入分发。

```typescript
class UIManager {
  constructor(input: Input);
  addWidget(widget: UIWidget): void;
  removeWidget(widget: UIWidget): void;
  update(dt: number): void;
  render(renderer: Renderer): void;
}
```

---

### UIWidget

UI 组件基类。

```typescript
abstract class UIWidget {
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;

  abstract render(ctx: CanvasRenderingContext2D): void;
  abstract hitTest(x: number, y: number): boolean;
}
```

---

### Button

按钮组件。

```typescript
class Button extends UIWidget {
  label: string;
  color: string;
  textColor: string;
  onClick: () => void;

  constructor(x: number, y: number, w: number, h: number, label: string, onClick: () => void);
  render(ctx: CanvasRenderingContext2D): void;
  hitTest(x: number, y: number): boolean;
}
```

---

### Label

文本标签组件。

```typescript
class Label extends UIWidget {
  text: string;
  color: string;
  font: string;
  align: TextAlign;

  constructor(x: number, y: number, text: string, options?: { color?: string; font?: string });
  render(ctx: CanvasRenderingContext2D): void;
}
```

---

### Panel

面板容器组件。

```typescript
class Panel extends UIWidget {
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  cornerRadius: number;
  children: UIWidget[];

  constructor(x: number, y: number, w: number, h: number, options?: PanelOptions);
  addWidget(widget: UIWidget): void;
  removeWidget(widget: UIWidget): void;
  render(ctx: CanvasRenderingContext2D): void;
}
```

---

### Joystick

虚拟摇杆组件。

```typescript
class Joystick extends UIWidget {
  baseR: number;       // 摇杆底座半径
  knobR: number;       // 摇杆旋钮半径
  active: boolean;     // 是否正在被操作
  visible: boolean;
  dx: number;          // 水平方向 -1 到 1
  dy: number;          // 垂直方向 -1 到 1
  cx: number;          // 摇杆中心 X
  cy: number;          // 摇杆中心 Y
  fixed: boolean;      // 是否固定位置
  pointerId: number | null;

  constructor(x: number, y: number, radius?: number);
  render(ctx: CanvasRenderingContext2D): void;
  hitTest(x: number, y: number): boolean;
}
```

---

### ProgressBar

进度条组件。

```typescript
class ProgressBar extends UIWidget {
  value: number;       // 当前值 0-1
  color: string;
  backgroundColor: string;

  constructor(x: number, y: number, w: number, h: number, options?: ProgressBarOptions);
  render(ctx: CanvasRenderingContext2D): void;
}
```

---

### ScrollView

滚动视图组件。

```typescript
class ScrollView extends UIWidget {
  scrollX: number;
  scrollY: number;
  contentWidth: number;
  contentHeight: number;
  children: UIWidget[];

  constructor(x: number, y: number, w: number, h: number);
  addWidget(widget: UIWidget): void;
  scrollTo(x: number, y: number): void;
  render(ctx: CanvasRenderingContext2D): void;
}
```

---

### Slider

滑块组件。

```typescript
class Slider extends UIWidget {
  value: number;       // 当前值 0-1
  color: string;
  onChange: (value: number) => void;

  constructor(x: number, y: number, w: number, h: number, options?: SliderOptions);
  render(ctx: CanvasRenderingContext2D): void;
}
```

---

### Toggle

开关组件。

```typescript
class Toggle extends UIWidget {
  checked: boolean;
  color: string;
  onChange: (checked: boolean) => void;

  constructor(x: number, y: number, w: number, h: number, options?: ToggleOptions);
  render(ctx: CanvasRenderingContext2D): void;
}
```

---

### Toast

提示消息组件。

```typescript
class Toast {
  show(message: string, duration?: number): void;
  hide(): void;
}
```

---

### Dialog

对话框组件。

```typescript
class Dialog {
  show(title: string, message: string, buttons?: DialogButton[]): void;
  hide(): void;
}
```

---

### HealthBar

血条组件。

```typescript
class HealthBar extends UIWidget {
  value: number;       // 当前值 0-1
  maxValue: number;
  color: string;
  backgroundColor: string;
  showText: boolean;

  constructor(x: number, y: number, w: number, h: number, options?: HealthBarOptions);
  render(ctx: CanvasRenderingContext2D): void;
}
```

---

### LayoutContainer

基础布局容器。

```typescript
class LayoutContainer extends UIWidget {
  padding: number;
  children: UIWidget[];

  constructor(x: number, y: number, w: number, h: number);
  addWidget(widget: UIWidget): void;
  layout(): void;
  render(ctx: CanvasRenderingContext2D): void;
}
```

---

### FlexLayout

弹性布局容器。

```typescript
class FlexLayout extends UIWidget {
  direction: 'row' | 'column';
  gap: number;
  children: UIWidget[];

  constructor(x: number, y: number, w: number, h: number, options?: FlexLayoutOptions);
  addWidget(widget: UIWidget): void;
  layout(): void;
  render(ctx: CanvasRenderingContext2D): void;
}
```

---

### ConstraintLayout

约束布局容器。

```typescript
class ConstraintLayout extends UIWidget {
  children: UIWidget[];

  constructor(x: number, y: number, w: number, h: number);
  addWidget(widget: UIWidget, constraints?: ConstraintOptions): void;
  layout(): void;
  render(ctx: CanvasRenderingContext2D): void;
}
```

---

### UILayout

UI 布局工具类（静态方法）。

```typescript
class UILayout {
  static center(widget: UIWidget, parentWidth: number, parentHeight: number): void;
  static distributeVertical(widgets: UIWidget[], startY: number, gap: number): void;
  static distributeHorizontal(widgets: UIWidget[], startX: number, gap: number): void;
}
```

---

## 动画系统

### Animator

动画控制器，管理动画播放。

```typescript
class Animator {
  clips: Map<string, AnimationClip>;
  currentClip: AnimationClip | null;
  playing: boolean;
  speed: number;

  addClip(clip: AnimationClip): void;
  play(clipName: string, loop?: boolean): void;
  stop(): void;
  update(dt: number): void;
}
```

---

### AnimationClip

动画片段，定义关键帧序列。

```typescript
class AnimationClip {
  name: string;
  duration: number;
  loop: boolean;
  frames: AnimationFrame[];

  constructor(name: string, frames: AnimationFrame[], options?: { duration?: number; loop?: boolean });
  getFrameAt(time: number): AnimationFrame;
}
```

---

### SkeletalAnimation

骨骼动画系统。

```typescript
class SkeletalAnimation {
  bones: Bone[];
  animations: Map<string, SkeletalClip>;

  addBone(bone: Bone): void;
  play(clipName: string, loop?: boolean): void;
  update(dt: number): void;
  getBoneTransform(boneName: string): Matrix2D;
}
```

---

## 特效系统

### Particle

粒子系统。

```typescript
class Particle extends Node {
  config: ParticleConfig;
  emitting: boolean;

  constructor(config: ParticleConfig);
  start(): void;
  stop(): void;
  update(dt: number): void;
}
```

---

### EnhancedParticle

增强粒子系统，支持更多特效。

```typescript
class EnhancedParticle extends Node {
  config: EnhancedParticleConfig;
  emitting: boolean;

  constructor(config: EnhancedParticleConfig);
  start(): void;
  stop(): void;
  burst(count: number): void;
  update(dt: number): void;
}
```

---

### Tween

补间动画系统。

```typescript
class Tween {
  static to(target: object, props: Record<string, number>, duration: number, options?: TweenOptions): Tween;
  static from(target: object, props: Record<string, number>, duration: number, options?: TweenOptions): Tween;

  delay(time: number): this;
  to(props: Record<string, number>, duration: number): this;
  repeat(count: number): this;
  yoyo(): this;
  onUpdate(callback: (target: object) => void): this;
  onComplete(callback: () => void): this;
  start(): void;
  stop(): void;
  update(dt: number): void;
}
```

**示例：**

```typescript
Tween.to(player, { x: 400, y: 300 }, 1.0, {
  easing: 'easeInOut',
  onComplete: () => console.log('移动完成')
});
```

---

## 游戏系统

### GameState

游戏状态管理器。

```typescript
class GameState {
  data: Record<string, unknown>;
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T): void;
  has(key: string): boolean;
  delete(key: string): void;
  clear(): void;
}
```

---

### InputMapping

输入映射系统，将按键/触摸映射为游戏动作。

```typescript
class InputMapping {
  addMapping(action: string, key: string): void;
  removeMapping(action: string, key: string): void;
  isActionActive(action: string): boolean;
  update(): void;
}
```

---

### SaveSystem

存档系统。

```typescript
class SaveSystem {
  save(key: string, data: unknown): void;
  load<T>(key: string): T | null;
  delete(key: string): void;
  exists(key: string): boolean;
}
```

---

### ScoreSystem

计分系统。

```typescript
class ScoreSystem {
  score: number;
  highScore: number;

  add(points: number): void;
  reset(): void;
  save(): void;
  load(): void;
}
```

---

## 物理系统

### Physics

物理引擎，支持速度、加速度、摩擦力。

```typescript
class Physics {
  static applyVelocity(entity: { x: number; y: number }, vx: number, vy: number, dt: number): void;
  static applyFriction(velocity: number, friction: number, dt: number): number;
  static checkBounds(entity: { x: number; y: number; width: number; height: number }, bounds: Rect): void;
}
```

---

## Tilemap

### Tilemap

瓦片地图系统。

```typescript
class Tilemap extends Node {
  tileWidth: number;
  tileHeight: number;
  cols: number;
  rows: number;
  data: number[][];

  constructor(options: TilemapOptions);
  getTile(col: number, row: number): number;
  setTile(col: number, row: number, value: number): void;
  worldToTile(x: number, y: number): { col: number; row: number };
  tileToWorld(col: number, row: number): { x: number; y: number };
  update(dt: number): void;
  render(renderer: Renderer): void;
}
```

---

## 网络系统

### WebSocket

WebSocket 封装，支持自动重连。

```typescript
class WebSocket {
  constructor(url: string, options?: WebSocketOptions);
  connect(): void;
  disconnect(): void;
  send(data: string | object): void;
  onMessage(callback: (data: unknown) => void): void;
  onClose(callback: () => void): void;
  onError(callback: (error: Error) => void): void;
  get connected(): boolean;
}
```

---

### HttpClient

HTTP 请求封装。

```typescript
class HttpClient {
  static get<T>(url: string): Promise<T>;
  static post<T>(url: string, body: unknown): Promise<T>;
  static put<T>(url: string, body: unknown): Promise<T>;
  static delete<T>(url: string): Promise<T>;
}
```

---

### StateSync

状态同步系统，用于多人游戏。

```typescript
class StateSync {
  constructor(socket: WebSocket);
  sendInput(input: InputFrame): void;
  onStateUpdate(callback: (state: GameState) => void): void;
  getInterpolatedState(): GameState;
  update(dt: number): void;
}
```

---

### LagCompensation

延迟补偿系统。

```typescript
class LagCompensation {
  constructor(historySize?: number);
  addSnapshot(state: GameState, timestamp: number): void;
  getSnapshotAt(timestamp: number): GameState | null;
  interpolate(from: GameState, to: GameState, t: number): GameState;
}
```

---

## 工具类

### Logger

日志工具。

```typescript
class Logger {
  static forModule(name: string): Logger;
  log(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  debug(message: string, ...args: unknown[]): void;
}
```

---

### Timer

定时器工具。

```typescript
class Timer {
  static delay(callback: () => void, ms: number): TimerHandle;
  static interval(callback: () => void, ms: number): TimerHandle;
  static clear(handle: TimerHandle): void;
}
```

---

### LRUCache

LRU 缓存。

```typescript
class LRUCache<T> {
  constructor(maxSize: number);
  get(key: string): T | undefined;
  set(key: string, value: T): void;
  has(key: string): boolean;
  delete(key: string): void;
  clear(): void;
  get size(): number;
}
```

---

### MathUtils

数学工具类。

```typescript
class MathUtils {
  static clamp(value: number, min: number, max: number): number;
  static lerp(a: number, b: number, t: number): number;
  static randomRange(min: number, max: number): number;
  static distance(x1: number, y1: number, x2: number, y2: number): number;
  static angle(x1: number, y1: number, x2: number, y2: number): number;
  static degToRad(deg: number): number;
  static radToDeg(rad: number): number;
}
```

---

### Storage

存储工具（兼容微信/抖音/H5）。

```typescript
class Storage {
  static get<T>(key: string): T | null;
  static set<T>(key: string, value: T): void;
  static remove(key: string): void;
  static clear(): void;
  static has(key: string): boolean;
}
```

---

### PerformanceMonitor

性能监控。

```typescript
class PerformanceMonitor {
  fps: number;
  frameTime: number;
  memoryUsage: number;

  update(): void;
  getStats(): PerformanceStats;
  reset(): void;
}
```

---

### ErrorHandler

错误处理器。

```typescript
class ErrorHandler {
  static init(): void;
  static capture(error: Error, context?: string): void;
  static onError(callback: (error: Error) => void): void;
}
```

---

### ErrorTracker

错误追踪器。

```typescript
class ErrorTracker {
  static track(error: Error, metadata?: Record<string, unknown>): void;
  static getErrors(): ErrorReport[];
  static clear(): void;
}
```

---

### ScreenAdapter

屏幕适配工具。

```typescript
class ScreenAdapter {
  static calculateLayout(
    designWidth: number,
    designHeight: number,
    screenWidth: number,
    screenHeight: number
  ): ScreenLayout;
}
```

---

### ResolutionScaler

分辨率缩放工具。

```typescript
class ResolutionScaler {
  static scale(
    width: number,
    height: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number; scale: number };
}
```

---

## 导入方式

### 统一入口

```typescript
import {
  Engine, Scene, Node, Ticker,
  Renderer, Sprite, Texture, TextNode,
  Input, TouchPoint,
  Loader,
  Audio,
  Collision, Rect, Circle,
  Vec2,
  WxPlatform, TtPlatform, H5Platform
} from 'game-engine';
```

### 按需导入

```typescript
import { Engine } from 'game-engine/dist/lib/engine/Engine';
import { Sprite } from 'game-engine/dist/lib/engine/render/Sprite';
```

---

## 构建输出

| 平台 | 输出目录 | 入口文件 |
|------|----------|----------|
| 微信小游戏 | `dist/wechat/` | `game.js` |
| 抖音小游戏 | `dist/douyin/` | `game.js` |
| H5 浏览器 | `dist/h5/` | `index.html` + `game.h5.js` |

---

## 扩展指南

### 新增平台

只需两步：
1. 实现 `IPlatform` 接口（参考 `WxPlatform.ts`）
2. 创建平台入口文件（参考 `entries/main.wx.ts`）

**引擎核心与游戏代码无需修改。**

### 新增组件

```typescript
import { Component } from 'game-engine';

class MyComponent extends Component {
  onAttach(): void {
    console.log('组件已挂载到', this.node);
  }

  onUpdate(dt: number): void {
    // 每帧更新逻辑
  }

  onDetach(): void {
    console.log('组件已移除');
  }
}
```
