# AI Engine Usage Guide

本文档给 AI agent 使用，目标是让 AI 在开发具体游戏时优先复用 `lite-game-engine`，而不是在业务项目里重新造引擎。

## 核心定位

`lite-game-engine` 是游戏底座。AI 在具体游戏项目中应把它当作 SDK 使用：

- 引擎负责主循环、场景树、渲染、输入、资源、碰撞、UI 和平台适配。
- 游戏项目只负责玩法、关卡、对象、UI 编排和资源配置。
- 除非任务明确要求维护引擎，否则不要修改 `src/engine/`。

## 标准启动方式

微信小游戏入口示例：

```ts
import { Engine, WxPlatform } from 'lite-game-engine';
import { MainScene } from './scenes/MainScene';

const engine = new Engine(new WxPlatform());
engine.setScene(new MainScene(engine));
engine.start();
```

H5 或抖音小游戏只需要替换平台适配器：

```ts
import { Engine, H5Platform, TtPlatform } from 'lite-game-engine';
```

## AI 必须优先使用的公开 API

```ts
Engine
Scene
Node
Sprite
TextNode
Renderer
Input
Loader
Audio
Collision
UIManager
Button
ScrollView
ListView
WxPlatform
TtPlatform
H5Platform
```

## 业务项目推荐目录

```text
src/
  main.wx.ts              平台入口，只做 Engine + Platform + Scene 启动
  scenes/                 场景：主菜单、战斗、结算等
  objects/                游戏对象：Player、Enemy、Bullet、Pickup
  ui/                     HUD、面板、按钮、列表
  config/                 数值配置、关卡配置、资源配置
  systems/                生成器、战斗系统、得分系统、存档系统
  assets/                 资源引用或资源清单
```

## AI 开发规则

1. 不要在业务游戏里自己实现主循环，使用 `Engine.start()`。
2. 不要在业务游戏里直接访问 `wx` / `tt` / `document`，平台能力通过适配器或 `IPlatform` 进入。
3. 不要复制 `Engine`、`Scene`、`Renderer`、`Input` 等引擎类。
4. 游戏页面优先建成 `Scene`。
5. 游戏对象优先继承 `Node` 或使用 `Sprite`。
6. 图片资源使用 `engine.loader.loadTexture()`。
7. JSON 配置使用 `engine.loader.loadJSON()`。
8. 碰撞使用 `Collision`。
9. UI 点击和滚动使用 `UIManager`、`Button`、`ScrollView`、`ListView`。
10. 只有当公开 API 缺能力时，才提出引擎增强方案，不要在业务代码中绕开底层。

## 推荐任务流程

AI 收到新游戏开发任务时，先输出：

1. 游戏类型和目标平台。
2. 文件结构。
3. 场景列表。
4. 游戏对象列表。
5. 使用到的引擎 API。
6. 最小可运行版本计划。

再开始写代码。

## 最小游戏对象模式

```ts
import { Node, Renderer } from 'lite-game-engine';

export class Player extends Node {
  speed = 420;

  constructor() {
    super();
    this.width = 48;
    this.height = 48;
  }

  update(dt: number): void {
    super.update(dt);
    // 玩法逻辑
  }

  protected draw(renderer: Renderer): void {
    renderer.drawRect(-24, -24, 48, 48, '#4ecdc4');
  }
}
```

## 最小 UI 模式

```ts
import { Button, Engine, UIManager } from 'lite-game-engine';

export function createStartButton(engine: Engine, onStart: () => void): UIManager {
  const ui = new UIManager(engine.input);
  const button = new Button('开始游戏', 180, 56);
  button.x = engine.width / 2;
  button.y = engine.height * 0.7;
  button.onClickCallback = onStart;
  ui.addWidget(button);
  return ui;
}
```

## 禁止事项

- 禁止在业务项目中新增第二套主循环。
- 禁止绕过引擎直接操作平台全局对象。
- 禁止为了一个业务需求大范围重写 `src/engine/`。
- 禁止把 Demo 代码复制成新的引擎实现。
- 禁止在没有测试或说明的情况下修改公开 API。

## 当引擎能力不足时

先输出增强提案：

```text
当前业务需求：
现有引擎缺口：
建议新增 API：
影响范围：
兼容性风险：
测试方案：
```

确认后再修改引擎。
