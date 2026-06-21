# 日志模块使用说明

## 目标

新的日志模块用于解决以下问题：

- 在开发模式下输出 `Debug` 级别日志，方便定位渲染、物理、网络等核心链路问题。
- 在生产模式下自动屏蔽 `Debug` 日志，避免不必要的主线程开销。
- 支持多终端输出：控制台、平台本地持久化日志文件、引擎内置调试面板。
- 提供统一时间戳、模块名、堆栈、对象序列化与格式化能力。

## 快速开始

```ts
import { Logger, LogLevel } from '../engine';

const renderLogger = Logger.forModule('Renderer');

Logger.configure({
  level: LogLevel.DEBUG,
  stackLevel: LogLevel.INFO,
  format: '[{timestamp}] [{level}] [{module}] {message}',
});

renderLogger.debug('frame=%d sprite=%o', 1, { id: 'hero', x: 10, y: 20 });
renderLogger.info('renderer initialized');
renderLogger.error('texture load failed url=%s', 'hero.png');
```

## 默认配置文件

默认配置位于 `src/engine/config/LoggerConfig.ts`，引擎启动时会自动读取：

```ts
export const ENGINE_LOGGER_CONFIG = {
  level: LogLevel.DEBUG,
  stackLevel: LogLevel.INFO,
  format: '[{timestamp}] [{level}] [{module}] {message}',
};
```

可以通过修改该文件调整日志阈值、面板容量、文件保留大小等参数，也可以在运行时再次调用 `Logger.configure()` 做动态覆盖。

## 输出终端

### 控制台

- 由 `console.enabled` 控制。
- `Debug / Info / Warning / Error / Fatal` 会自动映射到对应的控制台方法。

### 本地日志文件

- 由 `file.enabled` 控制。
- 当前实现采用平台本地存储作为跨端统一的“文件化日志”持久层，默认键名为 `engine.log`。
- 该方案兼容 H5、微信小游戏、抖音小游戏，不需要引入额外同步文件系统依赖。
- 通过 `file.maxChars` 控制保留上限，避免日志无限增长导致内存泄漏。

### 引擎内置调试面板

- 由 `panel.enabled` 控制。
- 面板会在每帧渲染结束后自动绘制到画布左上角。
- 仅保留最近 `panel.maxEntries` 条，避免 HUD 日志无限堆积。

## 构建模式

- `npm run watch` 或 `node scripts/build.mjs --dev`：开发构建，`__DEV__ === true`
- `npm run build`：生产构建，`__DEV__ === false`

生产构建下：

- `Logger.debug()` 在运行时直接屏蔽。
- 核心模块中的开发态 `if (__DEV__)` 调试分支会被 `esbuild` 折叠并从最终产物中移除。

## 格式化能力

日志消息支持以下占位符：

- `%s`：字符串
- `%d`：数字
- `%o`：对象序列化
- `%j`：JSON 风格对象序列化

日志行格式支持以下变量：

- `{timestamp}`
- `{level}`
- `{module}`
- `{message}`
- `{stack}`

示例：

```ts
Logger.configure({
  format: '[{timestamp}]<{level}>[{module}] {message}',
});
```

## 生命周期与内存安全

- 日志写入采用异步批量刷盘，避免在调用点执行同步 IO。
- 队列由 `maxQueueSize` 限制上限，防止异常日志风暴导致内存持续膨胀。
- 本地日志文件由 `maxChars` 控制上限。
- 调试面板由 `maxEntries` 控制上限。
- 引擎销毁时会调用 `Logger.flush()` 与 `Logger.dispose()` 清理资源。

## 已接入模块

- 渲染模块：`Renderer`
- 物理/碰撞模块：`Collision`
- 网络通信模块：`Loader.loadJSON()`

## 验证命令

```bash
npm run test:logger
npm run build
npm run verify:prod-logs
```
