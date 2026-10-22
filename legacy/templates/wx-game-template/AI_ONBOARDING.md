# AI_ONBOARDING

## 项目定位

这是一个基于 `lite-game-engine` 的微信小游戏业务项目模板。它用于创建新游戏的最小起点。

## 技术栈

- TypeScript
- Canvas 2D
- 微信小游戏
- lite-game-engine
- esbuild

## 启动链路

```text
src/main.wx.ts
  -> new Engine(new WxPlatform())
  -> engine.setScene(new MainScene(engine))
  -> engine.start()
```

## 核心文件

```text
src/main.wx.ts
src/scenes/MainScene.ts
src/objects/Player.ts
src/ui/MainHUD.ts
```

## 当前能力

- 可创建 Engine。
- 可进入 MainScene。
- 可通过触摸移动 Player。
- 可显示简单 HUD 分数。

## AI 修改原则

1. 新功能只写业务代码。
2. 不要修改引擎源码。
3. 不要新增第二套主循环。
4. 不要直接调用平台全局对象。
5. 先复用引擎公开 API。
6. 公开 API 不满足需求时，先提出引擎增强方案。

## 常用扩展方向

- 增加敌人：`src/objects/Enemy.ts`
- 增加子弹：`src/objects/Bullet.ts`
- 增加系统：`src/systems/Spawner.ts`
- 增加页面：`src/scenes/MenuScene.ts`
- 增加配置：`src/config/gameConfig.ts`
