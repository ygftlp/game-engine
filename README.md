# lite-wx-game-engine

轻量级 2D 微信小游戏开发引擎（TypeScript + Canvas 2D + esbuild）。

## 特性

- 平台适配层：封装 `wx.*` API，隔离平台差异，便于扩展到 H5
- 游戏主循环：固定时间步长，`update` / `render` 分离
- 渲染器：封装 Canvas 2D，绘制精灵、文本、图形
- 节点树 / 场景：父子坐标系，支持位置、旋转、缩放
- 精灵与纹理：图片异步加载与绘制
- 输入系统：封装触摸事件并转换为引擎内坐标
- 资源管理：图片、音频、JSON 异步加载与缓存
- 音频：封装 `InnerAudioContext`
- 碰撞检测：轻量 AABB 矩形与圆形碰撞

## 目录结构

```
src/
  engine/        引擎核心（可复用）
    platform/    平台适配层（Platform / WxPlatform）
    core/        主循环、节点树、场景
    render/      渲染器、精灵、纹理
    input/       输入系统
    loader/      资源管理
    audio/       音频
    collision/   碰撞检测
    math/        数学工具
    index.ts     引擎统一入口
  game/          示例游戏
  main.ts        微信小游戏入口
```

## 开发

```bash
npm install
npm run build      # 打包生成 game.js
npm run watch      # 监听构建
npm run typecheck  # 类型检查
```

构建产物 `game.js` 即微信小游戏入口，配合 `game.json` / `project.config.json` 在微信开发者工具中运行。

## 复用方式

直接复用 `src/engine/` 目录，在上层 `src/game/` 编写游戏逻辑，通过 `src/engine/index.ts` 导入所需 API。

## 示例

`src/game/DemoScene.ts` 演示：触摸拖动方块，与目标方块发生 AABB 碰撞时变红。
