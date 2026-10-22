# API 参考手册

## 使用约定

- 所有 API 名称以 `src/engine/index.ts` 为准
- 这里整理的是公开导出接口，不包含未导出的内部细节
- 代码示例默认以 TypeScript 编写

## 核心模块

### `Engine`

用途：引擎生命周期、主循环、场景切换、全局子系统入口。

```ts
const engine = new Engine(platform);
engine.setScene(scene);
engine.start();
```

| 成员 | 说明 |
| --- | --- |
| `constructor(platform: IPlatform)` | 创建引擎实例并初始化渲染、输入、资源与场景管理 |
| `renderer` | 全局渲染器 |
| `input` | 全局输入系统 |
| `loader` | 全局资源加载器 |
| `sceneManager` | 场景管理器 |
| `backgroundColor` | 每帧清屏颜色 |
| `setScene(scene)` | 替换当前场景 |
| `pushScene(scene)` | 压入新场景 |
| `popScene()` | 弹出当前场景 |
| `start()` | 启动主循环 |
| `destroy()` | 停止主循环并释放资源 |

### `Scene`

用途：作为节点树根容器，承载关卡或界面逻辑。

| 方法 | 返回值 | 说明 |
| --- | --- | --- |
| `onEnter()` | `void` | 场景进入时调用 |
| `onExit()` | `void` | 场景退出时调用 |
| `update(dt)` | `void` | 每帧更新；默认调用父类节点更新 |

### `Node`

用途：可变换、可挂组件、可命中的基本节点。

| 属性 / 方法 | 说明 |
| --- | --- |
| `x / y / rotation / scaleX / scaleY` | 2D 变换 |
| `width / height / anchorX / anchorY` | 包围盒与锚点 |
| `alpha / visible / zIndex` | 渲染控制 |
| `children` | 子节点列表 |
| `components` | 已挂载组件 |
| `addChild(child)` | 添加子节点 |
| `removeChild(child)` | 移除子节点 |
| `removeFromParent()` | 从父节点摘除 |
| `addComponent(component)` | 挂载组件 |
| `getComponent(type)` | 获取组件实例 |
| `removeComponent(component)` | 移除组件 |
| `update(dt)` | 递归更新自身组件和子节点 |
| `visit(renderer, parentMatrix)` | 递归渲染 |
| `hitTest(worldX, worldY)` | 命中检测 |
| `destroy()` | 释放自身、组件和子节点 |

### `Component`

用途：为 `Node` 追加可复用行为。

| 方法 | 说明 |
| --- | --- |
| `onAttach()` | 挂载时执行 |
| `onUpdate(dt)` | 每帧逻辑 |
| `onDetach()` | 移除时执行 |

## 渲染模块

### `Renderer`

| 方法 | 说明 |
| --- | --- |
| `constructor(canvas, width, height)` | 初始化 Canvas 2D 渲染器 |
| `clear(color?)` | 清屏 |
| `drawRect(x, y, w, h, color)` | 绘制矩形 |
| `drawText(text, x, y, color, font?)` | 绘制文本 |

### `Texture`

| 成员 | 说明 |
| --- | --- |
| `constructor(image)` | 包装平台图片对象 |
| `width` | 图片宽度 |
| `height` | 图片高度 |

### `Sprite`

| 方法 | 说明 |
| --- | --- |
| `constructor(texture?)` | 创建精灵节点 |
| `setTexture(texture, frame?)` | 设置纹理与可选图集区域 |
| `setFrame(frame)` | 切换图集帧 |

### `AnimationClip`

用途：定义离散帧动画。

关键配置：

- `name`
- `frames`
- `fps`
- `mode`

### `Animator`

常见用法：

```ts
const animator = new Animator();
animator.addClip(walkClip);
animator.play('walk');
```

## 输入模块

### `Input`

| 方法 | 返回值 | 说明 |
| --- | --- | --- |
| `onStart(fn, options?)` | `() => void` | 注册按下监听 |
| `onMove(fn, options?)` | `() => void` | 注册移动监听 |
| `onEnd(fn, options?)` | `() => void` | 注册抬起监听 |
| `off(event, fn)` | `void` | 移除指定监听器 |
| `removeAllListeners(includePersistent?)` | `void` | 清空监听器 |

`InputListenerOptions` 当前包含：

- `persistent?: boolean`

### `TouchPoint`

```ts
interface TouchPoint {
  id: number;
  x: number;
  y: number;
}
```

## 资源与音频

### `Loader`

| 方法 | 返回值 | 说明 |
| --- | --- | --- |
| `loadTexture(url)` | `Promise<Texture>` | 加载并缓存纹理 |
| `loadAudio(url)` | `Audio` | 创建音频实例并设置源 |
| `loadJSON<T>(url)` | `Promise<T>` | 加载并缓存 JSON |
| `loadAll(tasks, onProgress?)` | `Promise<void>` | 并行批量加载 |
| `getTexture(url)` | `Texture \| null` | 获取缓存纹理 |
| `unloadTexture(url)` | `boolean` | 卸载纹理缓存 |
| `unloadJSON(url)` | `boolean` | 卸载 JSON 缓存 |
| `unloadAll()` | `void` | 卸载所有资源 |
| `getCacheStats()` | 统计对象 | 获取缓存状态 |

### `Audio`

| 方法 / 属性 | 说明 |
| --- | --- |
| `load(url)` | 设置音频地址 |
| `play(loop?)` | 播放音频 |
| `pause()` | 暂停 |
| `stop()` | 停止 |
| `volume = v` | 调整音量 |
| `destroy()` | 销毁底层音频对象 |

## 碰撞与数学

### `Collision`

| 方法 | 说明 |
| --- | --- |
| `rectIntersect(a, b)` | AABB 矩形碰撞 |
| `circleIntersect(a, b)` | 圆形碰撞 |
| `rectCircleIntersect(rect, circle)` | 矩形与圆碰撞 |
| `pointInRect(px, py, rect)` | 点是否在矩形内 |
| `pointInCircle(px, py, circle)` | 点是否在圆内 |

### `Vec2`

常用实例方法：

- `add(v)`
- `subtract(v)`
- `scale(s)`
- `normalize()`
- `dot(v)`
- `length()`
- `distance(v)`
- `lerp(v, t)`
- `clone()`
- `equals(v)`

静态常量：

- `Vec2.ZERO`
- `Vec2.ONE`
- `Vec2.UP`
- `Vec2.DOWN`
- `Vec2.LEFT`
- `Vec2.RIGHT`

## 工具模块

### `Logger`

| 方法 | 说明 |
| --- | --- |
| `configure(config)` | 合并日志配置 |
| `attachPlatform(platform)` | 绑定存储能力 |
| `setDevelopmentMode(flag)` | 切换开发模式 |
| `setLevel(level)` | 设置日志阈值 |
| `forModule(moduleName)` | 获取模块级 logger |
| `flush()` | 立即刷出异步队列 |
| `renderPanel(renderer)` | 绘制调试面板 |
| `getPanelLines()` | 获取当前面板内容 |
| `dispose()` | 释放 sink 与缓存 |

### `ModuleLogger`

方法集合：

- `debug(message, ...args)`
- `info(message, ...args)`
- `warning(message, ...args)`
- `warn(message, ...args)`
- `error(message, ...args)`
- `fatal(message, ...args)`

### `Storage`

| 方法 | 说明 |
| --- | --- |
| `set(key, value)` | 存储 JSON 数据 |
| `get<T>(key, defaultValue?)` | 读取数据 |
| `has(key)` | 判断键是否存在 |
| `remove(key)` | 删除指定键 |
| `clear()` | 清空当前命名空间下的键 |

### 其他工具

| API | 说明 |
| --- | --- |
| `EventEmitter` | 事件发布订阅 |
| `Pool` | 对象池 |
| `TimerManager` | 延迟与循环计时 |
| `MathUtils` | 通用数学函数 |
| `LRUCache` | 最近最少使用缓存 |
| `ScreenAdapter` | 安全区域与布局适配 |
| `ErrorHandlerManager` | 全局错误处理 |

#### `TimerManager` 示例

```ts
const timers = new TimerManager();

const delayId = timers.delay(() => {
  logger.info('2 秒后触发');
}, 2);

const intervalId = timers.interval(() => {
  logger.debug('每秒触发一次');
}, 1);

timers.pause(intervalId);
timers.resume(intervalId);
timers.cancel(delayId);
timers.update(dt);
```

#### `ScreenAdapter` 示例

```ts
const adapter = new ScreenAdapter(375, 812, window.devicePixelRatio, {
  designWidth: 750,
  designHeight: 1334,
  fitMode: 'contain',
});

const pos = adapter.designToScreen(375, 667);
const safeArea = adapter.getScaledSafeArea();
```

## UI 模块

当前公开 UI 组件包括：

- `UIWidget`
- `Button`
- `Label`
- `ProgressBar`
- `Panel`
- `Toggle`
- `Slider`
- `Dialog`
- `Toast`
- `Joystick`
- `HealthBar`
- `UIManager`

推荐流程：

1. 创建具体控件实例
2. 设置尺寸、位置和名称
3. 挂入 `UIManager`
4. 由 `UIManager` 统一管理命中与交互

### `UIWidget`

基础能力：

- `interactive` / `disabled`
- `backgroundColor` / `borderColor` / `borderWidth`
- `borderRadius`
- `setPadding(padding)`
- `onTouchStart()` / `onTouchMove()` / `onTouchEnd()`

### `Button`

```ts
const button = new Button('开始游戏', 180, 56);
button.x = 200;
button.y = 320;
button.setStyle({
  normalColor: '#4ecdc4',
  pressedColor: '#45b7aa',
  textColor: '#ffffff',
  borderRadius: 12,
});
button.onClickCallback = () => {
  logger.info('button clicked');
};

uiManager.addWidget(button);
```

### `UIManager`

```ts
const uiManager = new UIManager(engine.input);
scene.addChild(uiManager);

const panel = new Panel(280, 140);
panel.name = 'hud-panel';
panel.x = 200;
panel.y = 120;
uiManager.addWidget(panel);

const found = uiManager.findWidgetByName('hud-panel');
```

## 商用扩展模块

公开导出：

- `I18n`
- `PaymentManager`
- `AnalyticsManager`
- `AntiAddictionSystem`

这部分 API 偏平台与业务集成，接入前建议结合项目实际需求和宿主平台能力阅读源代码。

## 平台接口

### `IPlatform`

关键能力包括：

- `createCanvas()`
- `createImage()`
- `createAudio()`
- `getScreenInfo()`
- `onPointerStart(handler)`
- `onPointerMove(handler)`
- `onPointerEnd(handler)`
- `requestJSON(url)`
- `requestAnimationFrame(cb)`
- `setStorage(key, value)`
- `getStorage(key)`
- `removeStorage(key)`
- `clearStorage()`

#### 最小接入示例

```ts
import { Engine, H5Platform } from 'lite-game-engine';

const platform = new H5Platform();
const engine = new Engine(platform);
engine.setScene(new GameScene());
engine.start();
```

#### H5 平台行为说明

- `createCanvas()` 会创建并挂载全屏 `canvas`
- 触摸与鼠标事件会统一为指针输入
- `requestJSON()` 基于 `fetch`
- 存储实现基于 `localStorage`

实现类：

- `H5Platform`
- `WxPlatform`
- `TtPlatform`
