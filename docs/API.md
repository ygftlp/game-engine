# lite-game-engine API 使用手册

本文档只记录当前仓库已经实现、并通过 `src/engine/index.ts` 对外导出的公开 API。未实现的规划能力不会写入本文件，避免误导接入方。

## 快速开始

```ts
import { Engine, Scene, WxPlatform } from 'lite-game-engine';

class GameScene extends Scene {
  onEnter(): void {
    console.log('scene enter');
  }

  update(dt: number): void {
    super.update(dt);
  }
}

const engine = new Engine(new WxPlatform());
engine.setScene(new GameScene());
engine.start();
```

## 对外导出总览

### 核心

```ts
Engine
Scene
Node
Ticker
EventEmitter
Pool
```

### 渲染

```ts
Renderer
Sprite
TextNode
Texture
TextureFrame
```

### 输入

```ts
Input
TouchPoint
InputListener
InputListenerOptions
```

### 资源、音频、碰撞、数学

```ts
Loader
ResourceDescriptor
ResourceType
Audio
Collision
Rect
Circle
Vec2
```

### UI

```ts
UIWidget
UIManager
UIEvent
UIEventHandler
Button
ButtonStyle
ButtonState
ScrollView
ListView
ScrollDirection
ScrollbarConfig
ScrollEvent
```

### 平台适配

```ts
IPlatform
ICanvas
IImage
IAudio
ScreenInfo
PointerPoint
PointerHandler
WxPlatform
TtPlatform
H5Platform
```

### 日志

```ts
Logger
LogLevel
LogEntry
LoggerConfig
LoggerPlatform
```

## Engine

`Engine` 是引擎主控制器。它接收一个平台适配器，创建渲染器、输入系统、资源加载器、场景管理器和主循环。

```ts
class Engine {
  readonly renderer: Renderer;
  readonly input: Input;
  readonly loader: Loader;
  readonly width: number;
  readonly height: number;
  readonly platform: IPlatform;
  readonly sceneManager: SceneManager;
  readonly currentScene: Scene | null;

  constructor(platform: IPlatform);
  setScene(scene: Scene): void;
  start(): void;
  stop(): void;
}
```

说明：

- `width / height` 为物理像素尺寸。
- `setScene(scene)` 会清空当前场景栈并设置初始场景。
- `start()` 已做防重复启动保护，多次调用不会创建多个主循环。
- `stop()` 会停止主循环。

## Scene

`Scene` 继承自 `Node`，作为节点树根容器。

```ts
class Scene extends Node {
  camera: Camera | null;
  engine?: Engine;

  onEnter(): void;
  onExit(): void;
  update(dt: number): void;
}
```

示例：

```ts
class GameScene extends Scene {
  update(dt: number): void {
    super.update(dt);
    // 每帧逻辑
  }
}
```

## Node

`Node` 是基础节点，支持树状结构、变换、透明度、层级、组件挂载和命中检测。

```ts
class Node {
  name: string;
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  visible: boolean;
  alpha: number;
  zIndex: number;
  width: number;
  height: number;
  anchorX: number;
  anchorY: number;
  parent: Node | null;
  readonly children: Node[];
  readonly components: Component[];
  readonly worldMatrix: Matrix2D;

  addChild(child: Node): Node;
  removeChild(child: Node): void;
  removeFromParent(): void;
  getChildrenInRenderOrder(): Node[];
  addComponent<T extends Component>(component: T): T;
  getComponent<T extends Component>(type: new (...args: never[]) => T): T | null;
  removeComponent(component: Component): void;
  update(dt: number): void;
  hitTest(worldX: number, worldY: number): Node | null;
}
```

## 渲染 API

### Renderer

```ts
class Renderer {
  readonly ctx: CanvasRenderingContext2D;
  readonly width: number;
  readonly height: number;

  clear(color?: string): void;
  drawRect(x: number, y: number, w: number, h: number, color: string): void;
  drawText(text: string, x: number, y: number, color: string, font?: string): void;
}
```

### Sprite

```ts
class Sprite extends Node {
  frame: TextureFrame | null;
  texture: Texture | null;

  setTexture(texture: Texture, frame?: TextureFrame | null): void;
  setFrame(frame: TextureFrame): void;
}
```

### Texture

```ts
interface TextureFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

class Texture {
  loaded: boolean;
  readonly image: IImage;
  readonly width: number;
  readonly height: number;
  dispose(): void;
}
```

## 输入 API

`Input` 将平台指针事件统一为引擎坐标。

```ts
interface TouchPoint {
  id: number;
  x: number;
  y: number;
}

type InputListener = (touches: TouchPoint[]) => void;

interface InputListenerOptions {
  persistent?: boolean;
}

class Input {
  onStart(fn: InputListener, options?: InputListenerOptions): void;
  offStart(fn: InputListener): void;
  onMove(fn: InputListener, options?: InputListenerOptions): void;
  offMove(fn: InputListener): void;
  onEnd(fn: InputListener, options?: InputListenerOptions): void;
  offEnd(fn: InputListener): void;
  removeAllListeners(): void;
  clearAll(): void;
}
```

## 资源 API

```ts
type ResourceType = 'texture' | 'audio' | 'json';

interface ResourceDescriptor {
  url: string;
  type: ResourceType;
}

class Loader {
  loadTexture(url: string): Promise<Texture>;
  loadAudio(url: string): Audio;
  loadJSON(url: string): Promise<unknown>;
  loadAll(resources: ResourceDescriptor[]): Promise<void>;
  unloadTexture(url: string): void;
  unloadAudio(url: string): void;
  unloadJSON(url: string): void;
  clearCache(): void;
  getCacheStats(): { textures: number; audios: number; jsons: number };
}
```

`loadAll()` 失败时会带上资源类型、URL 和错误原因，便于线上定位。

## 音频 API

```ts
class Audio {
  load(url: string): void;
  play(loop?: boolean): void;
  pause(): void;
  stop(): void;
  volume: number;
  destroy(): void;
}
```

## 碰撞 API

```ts
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

class Collision {
  static rectIntersect(a: Rect, b: Rect): boolean;
  static circleIntersect(a: Circle, b: Circle): boolean;
  static pointInRect(px: number, py: number, r: Rect): boolean;
  static initGrid(cellSize?: number): void;
  static insertToGrid(id: number, rect: Rect): void;
  static queryGrid(rect: Rect, excludeId?: number): number[];
  static getCollisionPairs(): Array<[number, number]>;
  static clearGrid(): void;
  static getGridStats(): { cells: number; objects: number; avgObjectsPerCell: number } | null;
}
```

## UI API

### UIManager

`UIManager` 负责 UI 组件生命周期、命中检测和输入事件分发。

```ts
class UIManager extends Node {
  constructor(input: Input);
  on(event: string, handler: UIEventHandler): () => void;
  off(event: string, handler: UIEventHandler): void;
  addWidget(widget: UIWidget): void;
  removeWidget(widget: UIWidget): void;
  clearAll(): void;
  findWidgetByName(name: string): UIWidget | null;
  update(dt: number): void;
  render(renderer: Renderer): void;
}
```

示例：

```ts
const ui = new UIManager(engine.input);
const button = new Button('开始', 160, 56);
button.x = engine.width / 2;
button.y = engine.height / 2;
button.onClickCallback = () => console.log('click');
ui.addWidget(button);
engine.currentScene?.addChild(ui);
```

### UIWidget

```ts
abstract class UIWidget extends Node {
  interactive: boolean;
  disabled: boolean;
  stopPropagation: boolean;
  backgroundColor: string | null;
  borderColor: string | null;
  borderWidth: number;
  borderRadius: number;
  clipContent: boolean;

  setBackgroundImage(texture: Texture, frame?: TextureFrame, stretch?: UIImageStretch): void;
  clearBackgroundImage(): void;
  setPadding(padding: number): void;
  onTouchStart(point: TouchPoint): void;
  onTouchMove(point: TouchPoint): void;
  onTouchEnd(point: TouchPoint): void;
  onTouchCancel(): void;
  onHoverStart(): void;
  onHoverEnd(): void;
}
```

### Button

```ts
class Button extends UIWidget {
  text: string;
  onClickCallback: (() => void) | null;

  constructor(text?: string, width?: number, height?: number);
  setStyle(style: ButtonStyle): void;
  setImages(normal: Texture | null, pressed?: Texture | null, disabled?: Texture | null, frame?: TextureFrame): void;
}
```

### ScrollView / ListView

```ts
class ScrollView extends UIWidget {
  direction: ScrollDirection;
  contentWidth: number;
  contentHeight: number;
  scrollbar: ScrollbarConfig;
  inertiaDecay: number;
  elastic: boolean;
  elasticStrength: number;
  onScroll: ((event: ScrollEvent) => void) | null;

  getScrollPosition(): { x: number; y: number };
  setScrollPosition(x: number, y: number): void;
  scrollTo(x: number, y: number, duration?: number): void;
  scrollToTop(duration?: number): void;
  scrollToBottom(duration?: number): void;
  scrollToLeft(duration?: number): void;
  scrollToRight(duration?: number): void;
  getMaxScrollX(): number;
  getMaxScrollY(): number;
  getScrollRatio(): { x: number; y: number };
}

class ListView extends ScrollView {
  itemHeight: number;
  itemWidth: number;
  renderItem: ((item: unknown, index: number) => UIWidget) | null;

  constructor(width: number, height: number, itemHeight?: number);
  setData(data: unknown[]): void;
  getData(): unknown[];
  refresh(): void;
}
```

说明：`ScrollView` 的滚动动画由 `update(dt)` 驱动，不依赖全局 `requestAnimationFrame`。滚动偏移会同步到子节点矩阵，避免显示位置和点击命中位置不一致。

## 平台适配 API

```ts
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

平台实现：

```ts
new WxPlatform();
new TtPlatform();
new H5Platform();
```

## 日志 API

```ts
enum LogLevel {
  DEBUG = 10,
  INFO = 20,
  WARNING = 30,
  ERROR = 40,
  FATAL = 50,
  SILENT = 99,
}

class Logger {
  static configure(config: Partial<LoggerConfig>): void;
  static attachPlatform(platform: LoggerPlatform): void;
  static setDevelopmentMode(development: boolean): void;
  static setLevel(level: LogLevel): void;
  static forModule(moduleName: string): ModuleLogger;
  static renderPanel(target: { ctx: CanvasRenderingContext2D; width: number; height: number }): void;
  static getPanelLines(): string[];
  static flush(): Promise<void>;
  static dispose(): void;
}
```

示例：

```ts
import { Logger, LogLevel } from 'lite-game-engine';

Logger.setLevel(LogLevel.INFO);
Logger.forModule('Game').info('ready');
```

## Skill / 技能系统

当前仓库未实现 Skill / 技能系统，因此没有 Skill API。后续如果要承载战机技能、冷却、触发器、Buff、技能特效，建议单独新增：

```text
src/engine/skill/
  Skill.ts
  SkillManager.ts
  SkillCooldown.ts
  SkillEffect.ts
  SkillTrigger.ts
```

在实现前，不建议在 API 文档中暴露 Skill 能力。
