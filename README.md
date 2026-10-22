# game-kit（仓库：game-engine）

无头游戏逻辑组件库：纯 TypeScript、零平台依赖（不碰 canvas / wx / DOM 平台 API），
输入输出都是数据。组件从**真实项目**中提取并被真实项目消费——先有消费者，再有组件。

> 历史：本仓库原为 lite-game-engine（完整 2D 引擎）。2026-10-22 重构后方向转为组件库，
> 旧引擎整体冻结于 `legacy/`（只读参考与组件矿场，其自述文档见 `legacy/ENGINE_README.md`）。
> 包名 `game-kit`，仓库名保持 `game-engine`。

## 三铁律（防止再长出一个没人用的 23k 行摆设）

1. **没有真实消费者不进库**：组件必须正在被至少一个真实游戏/项目引用；从业务代码
   提取，或为第二个消费者而抽象。凭空设计的组件一律拒绝。
2. **进库必须带测试与说明**：每个组件目录含源码、`index.ts`、一页 README；
   `tests/` 下有对应测试。`npm test` 与 `npm run typecheck` 必须全绿才算进库完成。
3. **平台层永不进库**：渲染、场景管理、微信/抖音/H5 平台 API、UI 控件都是每款游戏
   自己的皮，不属于组件。组件只依赖 `src/` 内的其他组件。

## 组件清单（v0.1.0，第一批）

| 组件 | 路径 | 一句话 | 来源 |
|---|---|---|---|
| events | `src/events` | 类型友好的事件总线（on/once/off/emit） | lite-game-engine core（自带测试迁入） |
| pool | `src/pool` | 通用对象池，热循环零分配 | lite-game-engine core（自带测试迁入） |
| timer | `src/timer` | 计时器调度（延迟/重复/取消） | lite-game-engine utils（自带测试迁入） |
| state-machine | `src/state-machine` | FSM + 分层 FSM，守卫与优先级转移 | lite-game-engine ai（测试新补） |
| math | `src/math` | Vec2 二维向量 | lite-game-engine math（自带测试迁入） |
| grid | `src/grid` | 网格 A* 寻路 + 空间网格宽相碰撞 | lite-game-engine ai/collision（测试新补；NavMesh 未迁入——无消费者） |
| tween | `src/tween` | 补间动画（缓动/链式/管理器） | lite-game-engine effects（测试新补） |

后续毕业队列（等真实抽取发生时进库，不提前占位）：行为树、Steering、
FlashOut 的 input 路由、stealth 感知模型、playtest 灰测工具包、结算/战报模型。

## 使用

```bash
npm install
npm run build:lib   # 产出 dist/lib（esm+cjs）与 dist/types
npm test            # kit 测试（默认门禁）
npm run typecheck
npm run test:legacy # 冻结区旧引擎测试（不进默认门禁）
```

消费方式与本仓库既有习惯一致：业务项目以 `file:` 依赖指向本仓库的 `dist/lib`
（先在本仓库执行 `npm run build:lib`）。

## 版本

语义化版本。破坏性变更升 minor（0.x 阶段）。发布以 git tag 为准（`v0.1.0` 起）。
