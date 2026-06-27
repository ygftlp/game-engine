# lite-game-engine

轻量级通用 2D 游戏引擎（TypeScript + Canvas 2D + esbuild），一套代码支持微信小游戏、抖音小游戏、H5 三端。

## 项目定位

当前仓库定位为**平台无关的 2D 游戏引擎 + 三端 Demo**，不是完整业务游戏项目。它提供主循环、场景树、渲染、输入、资源、音频、碰撞、UI 与平台适配能力，业务游戏可以基于这些 API 继续扩展。

## 设计原则：平台无关

引擎核心与具体平台解耦，核心代码不直接依赖 `wx` / `tt` / `document`。平台能力通过 `IPlatform` 接口从外部依赖注入。

### 三层架构

- **引擎核心层**：`Engine`、`Node`、`Scene`、`Renderer`、`Input`、`Loader`、`Audio`、`Collision`、`UIManager` 等。
- **平台适配层**：`WxPlatform`、`TtPlatform`、`H5Platform`。
- **游戏层 + 入口**：游戏逻辑用引擎 API 编写，入口按平台注入适配器。

## 目录结构

```text
src/
  engine/        引擎核心（平台无关，可复用）
    platform/    平台接口与适配器
    core/        主循环、节点树、场景、事件、对象池
    render/      渲染器、精灵、纹理、文本
    input/       输入系统
    loader/      资源管理
    audio/       音频
    collision/   碰撞检测
    math/        数学工具
    ui/          UI 组件与 UI 事件管理
    utils/       日志等工具
    index.ts     引擎统一入口
  game/          示例游戏（三端复用同一份）
  entries/       各平台入口（main.wx.ts / main.tt.ts / main.h5.ts）
  web/           H5 的 index.html
```

## 安装与构建

```bash
npm install
npm run typecheck
npm run build
npm test
```

构建输出：

- 微信小游戏：`dist/wechat/game.js`、`dist/wechat/game.json`、`dist/wechat/project.config.json`
- 抖音小游戏：`dist/douyin/game.js`、`dist/douyin/game.json`
- H5：`dist/h5/index.html`、`dist/h5/game.h5.js`

详细发布说明见 [`docs/Release.md`](docs/Release.md)。

## 最小示例

```ts
import { Engine, Scene, WxPlatform } from 'lite-game-engine';

class GameScene extends Scene {
  onEnter(): void {
    console.log('scene enter');
  }

  update(dt: number): void {
    super.update(dt);
    // 游戏逻辑
  }
}

const engine = new Engine(new WxPlatform());
engine.setScene(new GameScene());
engine.start();
```

## UI 示例

```ts
import { Button, UIManager } from 'lite-game-engine';

const ui = new UIManager(engine.input);
const button = new Button('开始游戏', 160, 56);
button.x = engine.width / 2;
button.y = engine.height / 2;
button.onClickCallback = () => {
  console.log('start');
};
ui.addWidget(button);
engine.currentScene?.addChild(ui);
```

## 日志与资源

```ts
import { Loader, Logger, LogLevel } from 'lite-game-engine';

Logger.setLevel(LogLevel.INFO);

await engine.loader.loadAll([
  { type: 'json', url: 'assets/config.json' },
  { type: 'texture', url: 'assets/player.png' }
]);
```

## API 文档

完整 API 说明见 [`docs/API.md`](docs/API.md)。当前文档只记录仓库已实现并从 `src/engine/index.ts` 导出的公开 API。

## Skill / 技能系统状态

当前仓库尚未实现 Skill / 技能系统，因此本次未新增 Skill 代码。后续如果要支持战机技能、冷却、触发器、Buff、技能特效，建议新增独立模块：

```text
src/engine/skill/
  Skill.ts
  SkillManager.ts
  SkillCooldown.ts
  SkillEffect.ts
  SkillTrigger.ts
```

## 复用与扩展

新增平台时，实现一个 `IPlatform` 适配器并提供平台入口即可。引擎核心与游戏代码无需直接改为平台 API。

## 示例场景

`src/game/DemoScene.ts` 是一个可拖动方块 Demo：玩家方块与目标方块发生 AABB 碰撞时变色。它用于验证三端输入、渲染与碰撞链路。
