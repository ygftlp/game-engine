# wx-game-template

这是一个基于 `lite-game-engine` 的微信小游戏业务项目模板。它用于指导 AI 快速创建新游戏，而不是重写引擎。

## 使用方式

把本目录复制到你的游戏项目目录，例如：

```text
workspace/
  packages/game-engine/
  games/my-new-game/
```

然后在游戏项目里安装依赖：

```bash
npm install
npm run build
```

## 目录说明

```text
src/
  main.wx.ts              微信小游戏入口
  scenes/MainScene.ts     主场景
  objects/Player.ts       示例玩家对象
  ui/MainHUD.ts           示例 HUD
```

## AI 开发约束

- 不修改 `lite-game-engine` 源码。
- 不复制引擎类。
- 不直接访问 `wx`。
- 新玩法写在 `src/scenes`、`src/objects`、`src/ui`、`src/systems`。
- 入口文件只做平台适配器、Engine 和 Scene 启动。
