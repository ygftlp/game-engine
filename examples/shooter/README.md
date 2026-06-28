# Shooter Example

这是一个面向 AI 的 `lite-game-engine` 射击游戏示例。目标不是完整商业玩法，而是展示 AI 如何用引擎 API 组织一个最小可扩展的射击游戏。

## 覆盖能力

- `Engine` 启动游戏
- `Scene` 管理战斗场景
- `Node` 表示玩家、敌人、子弹
- `Renderer` 绘制自定义形状
- `Input` 控制玩家移动
- `Collision` 做矩形碰撞
- `TextNode` 绘制文本
- `UIManager` 和 `Button` 组织 HUD / 按钮

## 目录

```text
examples/shooter/src/
  main.wx.ts
  scenes/ShooterScene.ts
  objects/Player.ts
  objects/Enemy.ts
  objects/Bullet.ts
  ui/HUD.ts
```

## AI 使用方式

AI 开发类似游戏时应参考此结构：

1. 入口文件只负责创建 `Engine` 和初始 `Scene`。
2. 场景负责对象生命周期、刷新、碰撞和分数。
3. 游戏对象继承 `Node`，只处理自身数据、更新和绘制。
4. HUD 使用引擎 UI 能力，不直接散落在场景里绘制文字。
5. 不要复制引擎底层代码。
