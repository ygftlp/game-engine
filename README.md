# lite-game-engine

轻量级通用 2D 游戏引擎（TypeScript + Canvas 2D + esbuild），**一套代码同时支持微信小游戏 / 抖音小游戏 / H5 三端**。

## 设计原则：平台无关

引擎核心与任何具体平台（微信 / 抖音 / 浏览器）**零耦合**，核心代码中绝不出现 `wx` / `tt` / `document`。平台能力通过 `IPlatform` 接口从外部**依赖注入**。

### 三层架构

- **引擎核心层**（platform-agnostic）：`Engine`、`Node`、`Scene`、`Renderer`、`Input`、`Loader`、`Audio`、`Collision` 等，只依赖 `IPlatform`。
- **平台适配层**：`WxPlatform`（微信）、`TtPlatform`（抖音）、`H5Platform`（浏览器）。
- **游戏层 + 入口**：游戏逻辑用引擎 API 编写；入口按平台分别注入适配器。

## 目录结构

```
src/
  engine/        引擎核心（平台无关，可复用）
    platform/    平台接口与适配器（Platform / WxPlatform / TtPlatform / H5Platform）
    core/        主循环、节点树、场景
    render/      渲染器、精灵、纹理
    input/       输入系统
    loader/      资源管理
    audio/       音频
    collision/   碰撞检测
    math/        数学工具
    index.ts     引擎统一入口
  game/          示例游戏（三端复用同一份）
  entries/       各平台入口（main.wx.ts / main.tt.ts / main.h5.ts）
  web/           H5 的 index.html
```

## 构建

```bash
npm install
npm run build      # 输出 dist/{wechat,douyin,h5}
npm run typecheck  # 类型检查
```

- 微信：`dist/wechat/game.js`（配合 `game.json` / `project.config.json`）
- 抖音：`dist/douyin/game.js`
- H5：`dist/h5/index.html` + `dist/h5/game.h5.js`

## 复用与扩展

新增一个平台只需：实现一个 `IPlatform` 适配器 + 一个入口文件。**引擎核心与游戏代码无需修改**。

## 示例

`src/game/DemoScene.ts`：一个可拖动方块，与目标方块发生 AABB 碰撞时变红。三端复用同一份场景代码。
