# 发布与构建指南

本文档说明 `lite-game-engine` 当前三端构建产物、发布前检查项和导入方式。

## 基础命令

```bash
npm install
npm run typecheck
npm run build
npm test
```

推荐发布前至少执行：

1. `npm run typecheck`
2. `npm run build`
3. `npm test`
4. 分别在微信开发者工具、抖音开发者工具、浏览器中做 smoke test

## 构建输出

执行：

```bash
npm run build
```

输出目录：

```text
dist/
  wechat/
    game.js
    game.json
    project.config.json
  douyin/
    game.js
    game.json
  h5/
    index.html
    game.h5.js
```

## 微信小游戏

产物目录：

```text
dist/wechat
```

包含：

- `game.js`
- `game.json`
- `project.config.json`

导入步骤：

1. 打开微信开发者工具。
2. 选择小游戏项目。
3. 导入 `dist/wechat` 目录。
4. 首次导入如使用游客 AppID，可后续替换 `project.config.json` 中的真实 AppID。
5. 在模拟器中确认 Demo 能启动、拖动方块正常、碰撞变色正常。
6. 使用真机预览确认 touch start / move / end 行为正常。

重点验证：

- 按钮点击是否能触发 `onClickCallback`。
- 触摸结束是否正常触发 UI release。
- `game.json` 是否被正确识别。
- 画布是否全屏且没有被系统状态栏遮挡。

## 抖音小游戏

产物目录：

```text
dist/douyin
```

包含：

- `game.js`
- `game.json`

导入步骤：

1. 打开抖音小游戏开发者工具。
2. 导入 `dist/douyin` 目录。
3. 检查入口 `game.js` 是否加载成功。
4. 在模拟器与真机预览中验证触摸、渲染和资源加载。

如后续抖音端需要专属配置文件，建议新增平台专属配置并在 `scripts/build.mjs` 中替换复制逻辑。

## H5

产物目录：

```text
dist/h5
```

包含：

- `index.html`
- `game.h5.js`

本地预览示例：

```bash
npx serve dist/h5
```

或使用任意静态服务器托管 `dist/h5`。

重点验证：

- Canvas 是否铺满浏览器视口。
- DPR 设备下画面是否清晰。
- 鼠标事件和触摸事件是否都正常。
- 页面是否没有滚动条和默认触摸滚动干扰。

## 库模式发布

执行：

```bash
npm run build:lib
```

输出：

```text
dist/lib/index.mjs
dist/lib/index.cjs
dist/lib/package.json
dist/types/
```

发布前检查：

- `dist/types/index.d.ts` 是否生成成功。
- `package.json` 的 `main/module/types/exports` 是否指向正确文件。
- 外部项目能否通过 `import { Engine } from 'lite-game-engine'` 正常使用。

## Smoke Test 清单

### 引擎启动

- `new Engine(new WxPlatform())` 正常创建。
- `engine.setScene(scene)` 正常进入场景。
- `engine.start()` 多次调用不会创建多个主循环。
- `engine.stop()` 能停止主循环。

### 输入系统

- touch start 能触发。
- touch move 能触发。
- touch end 使用 `changedTouches`，按钮 release/click 能正常触发。
- H5 鼠标按下、移动、释放正常。

### UI 系统

- `UIManager` 能接收 `Input`。
- `Button` 能触发 `onClickCallback`。
- `ScrollView` 滚动后，显示位置和点击命中位置一致。
- `ListView` 可见项刷新正常。

### 资源系统

- `Loader.loadTexture()` 成功加载图片。
- `Loader.loadJSON()` 成功加载 JSON。
- `Loader.loadAll()` 失败时能输出资源类型、URL 和错误原因。

### 平台适配

- 微信端无 `document/window` 依赖泄漏。
- 抖音端无 `wx` 依赖泄漏。
- H5 端 Canvas CSS 尺寸和物理像素尺寸适配正常。

## Skill / 技能系统发布状态

当前仓库没有 Skill / 技能模块，因此发布包中不包含技能系统 API。

后续如果要支持技能系统，建议先新增独立模块和测试，再更新：

- `src/engine/index.ts`
- `docs/API.md`
- `README.md`
- `docs/Release.md`

建议模块结构：

```text
src/engine/skill/
  Skill.ts
  SkillManager.ts
  SkillCooldown.ts
  SkillEffect.ts
  SkillTrigger.ts
```

在 Skill 模块实现前，不建议在发布说明中承诺相关能力。
