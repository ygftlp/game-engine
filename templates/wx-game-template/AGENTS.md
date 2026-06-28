# AGENTS

本模板用于指导 AI 使用 `lite-game-engine` 开发业务游戏。

## 工作边界

- 当前目录是业务游戏模板，不是引擎源码。
- AI 默认只能修改 `src/` 下的业务代码。
- 不要复制或重写 `Engine`、`Scene`、`Renderer`、`Input`、`Loader`、`Collision`。
- 不要直接访问 `wx`，入口中只允许使用 `WxPlatform`。

## 必看顺序

1. `README.md`
2. `package.json`
3. `src/main.wx.ts`
4. `src/scenes/MainScene.ts`
5. `src/objects/Player.ts`
6. `src/ui/MainHUD.ts`

## 开发规则

- 新页面写成 `Scene`。
- 新游戏对象写成 `Node` 或 `Sprite`。
- 新 UI 优先使用 `UIManager`、`Button`、`ScrollView`。
- 输入从 `engine.input` 进入。
- 资源从 `engine.loader` 进入。
- 碰撞使用 `Collision`。
- 修改后说明影响范围和涉及文件。

## 提交建议

- `feat:` 新玩法、新页面、新对象
- `fix:` bug 修复
- `docs:` 文档
- `refactor:` 不改变行为的重构
- `test:` 测试
- `chore:` 配置或工程调整
