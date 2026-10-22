# 技术架构

## 总览

引擎采用“核心层 + 平台适配层 + 游戏层”的三层结构：

- 核心层：`Engine`、`Scene`、`Node`、`Renderer`、`Input`、`Loader`、`Audio`、`Collision`、`Logger`
- 平台适配层：`H5Platform`、`WxPlatform`、`TtPlatform`
- 游戏层：业务场景、UI、演示项目与平台入口

核心层不直接访问 `wx`、`tt` 或 `document`，而是通过 `IPlatform` 抽象能力，从而保持跨端一致性。

## 引擎主循环

`Engine` 在构造阶段完成如下初始化：

1. 读取屏幕尺寸与像素比，计算内部逻辑分辨率
2. 绑定日志平台、创建调试面板配置
3. 创建 `Renderer`、`Input`、`Loader`、`SceneManager`
4. 用 `Ticker` 启动统一帧循环
5. 在每帧执行 `update -> render`

渲染阶段由 `Scene.visit()` 驱动整棵节点树，更新世界矩阵后按渲染顺序绘制。场景切换时，`SceneManager` 会触发输入监听清理，避免已退出场景残留事件。

## 模块依赖关系

| 模块 | 直接依赖 | 主要职责 |
| --- | --- | --- |
| `Engine` | `IPlatform`、`Renderer`、`Input`、`Loader`、`SceneManager`、`Ticker` | 生命周期、帧循环、场景切换 |
| `Renderer` | `ICanvas` | 封装 Canvas 2D 绘制上下文 |
| `Scene` / `Node` | `Matrix2D`、`Renderer` | 组织节点树、变换、渲染、命中 |
| `Input` | `IPlatform` | 将平台指针事件归一化为引擎坐标 |
| `UIManager` | `Input`、`Node` | UI 命中、交互与持久监听 |
| `Loader` | `IPlatform`、`Texture`、`Audio`、`LRUCache` | 资源加载、缓存、释放 |
| `Audio` | `IPlatform` | 封装宿主音频上下文 |
| `Collision` | 无外部依赖 | 轻量 2D 碰撞检测 |
| `Logger` | `IPlatform` 可选存储接口 | 异步日志、调试面板、持久化 |

## 渲染系统

### 实现逻辑

- 渲染后端为 `CanvasRenderingContext2D`
- `Renderer.clear()` 在每帧开始时重置变换矩阵与透明度，避免状态污染
- `Node.visit()` 将局部变换叠加到父级世界矩阵，并把矩阵写回 `worldMatrix`
- 子节点按 `zIndex` 升序绘制，视觉上后绘制的节点覆盖先绘制的节点

### 数据流

1. `Engine.render()` 调用当前场景的 `visit()`
2. `Node.visit()` 计算世界矩阵并保存到节点
3. 子类在 `draw(renderer)` 中输出具体绘制命令
4. `Logger.renderPanel()` 在场景绘制后叠加调试面板

### 性能优化

- `Node` 对排序结果做缓存，仅在增删子节点或修改 `zIndex` 时重新排序
- 通过早退出跳过 `visible = false` 或 `alpha <= 0` 的节点
- 使用 Canvas 状态栈配合世界矩阵，避免重复自行计算顶点数据

## 物理与碰撞

当前版本不包含刚体求解器、连续碰撞检测或物理世界模拟。物理模块的真实范围是：

- `Collision.rectIntersect()`
- `Collision.circleIntersect()`
- `Collision.rectCircleIntersect()`
- `Collision.pointInRect()`
- `Collision.pointInCircle()`

这是一套面向 2D 休闲游戏的轻量碰撞工具。复杂物理行为需要在游戏层自行组织速度、重力、碰撞响应和状态机。

### 性能策略

- 纯数学计算，无平台依赖
- 对输入非法值保留开发态日志，生产构建中自动剥离调试字符串
- 可搭配 `SpatialGrid` 做粗粒度空间分区

## 资源管理系统

`Loader` 同时负责纹理、音频和 JSON 资源：

- 纹理：通过 `createImage()` 异步加载并包装为 `Texture`
- 音频：通过 `Audio` 封装宿主音频上下文
- JSON：通过 `platform.requestJSON()` 拉取并缓存

### 缓存机制

- 纹理缓存与 JSON 缓存均使用 `LRUCache`
- `loadingPromises` 复用进行中的纹理请求，避免相同 URL 重复并发加载
- `loadAll()` 并行执行所有加载任务，任何子任务失败都会整体抛错

### 性能与稳定性

- 缓存命中直接返回，减少网络与解码开销
- 资源卸载显式调用 `unloadTexture()`、`unloadJSON()` 或 `unloadAll()`
- 音频实例集中保存在 `audioInstances` 中，销毁时统一回收

## 脚本运行时

当前引擎没有内置 Lua、JS VM 或热更新解释器。脚本运行时即宿主平台自身的 JavaScript 运行时：

- H5：浏览器 JavaScript 引擎
- 微信小游戏：微信宿主 JavaScript 环境
- 抖音小游戏：抖音宿主 JavaScript 环境

开发者编写的 TypeScript 逻辑会在构建阶段经 esbuild 转换成目标平台可执行的 JavaScript Bundle。

## 输入处理模块

`Input` 负责把宿主层的触摸或鼠标事件统一转成 `TouchPoint[]`：

- `onPointerStart` -> `onStart`
- `onPointerMove` -> `onMove`
- `onPointerEnd` -> `onEnd`

坐标在输入阶段会乘以像素比，转换成引擎内部坐标系。

### 监听器分层

- 普通监听器：场景切换时清理
- `persistent` 监听器：供 `UIManager` 等全局系统常驻使用

这一设计解决了 UI 管理器在场景切换后失效的问题，也让系统级输入与场景级输入可以共存。

## 音频系统

`Audio` 是宿主音频能力的薄封装，职责集中在：

- 设置音频源
- 播放 / 暂停 / 停止
- 循环播放
- 音量控制
- 销毁底层音频对象

音频混音、总线、3D 空间音效与高级 DSP 当前并未实现。

## 日志与诊断

日志模块在架构中承担两类职责：

- 开发态诊断：控制台、调试面板、存储落盘
- 运行期证据收集：模块名、时间戳、调用栈、格式化参数

核心特性：

- 多级别日志：`DEBUG / INFO / WARNING / ERROR / FATAL`
- 异步批量刷出，避免每次写入阻塞主线程
- 生产构建使用 `DEV:` 标签与 esbuild `dropLabels` 剥离开发态调试日志

## 数据流转

典型一帧的数据流如下：

1. 平台适配器把触摸或鼠标输入交给 `Input`
2. `Ticker` 触发 `Engine.update(dt)`
3. 当前 `Scene` 更新组件、节点和游戏逻辑
4. 游戏逻辑按需请求 `Loader`、`Audio`、`Storage`、`Logger`
5. `Engine.render()` 调用节点树渲染
6. `Logger` 在顶层叠加调试信息

## 兼容性与图形 API 说明

当前版本支持：

- Windows、macOS、Linux 上的 Node.js 开发环境
- H5 浏览器、微信小游戏、抖音小游戏运行环境
- Canvas 2D 图形接口

当前版本不直接支持：

- DirectX 12
- Vulkan
- OpenGL 4.5

如果目标平台内部以 OpenGL、Metal、DirectX 或其他图形后端实现其 Canvas 2D，这属于宿主平台行为，不是引擎直接控制的 API 层。
