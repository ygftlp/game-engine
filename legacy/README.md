# legacy/ — lite-game-engine 冻结区

2026-10-22 仓库重构（分支 feat/game-kit-restructure）：本仓库的产品方向转为
**game-kit 无头组件库**（见根 README）。原 lite-game-engine 全量代码
（engine/、game-demos/、entries/、web/、tests/、typings/、examples/、
templates/、docs/、scripts/）原样冻结于此：

- **只读**：不再接受功能修改；这里的代码不是任何线上产品的运行时。
- **价值**：参考实现与组件矿场——game-kit 的组件从这里提取（提取后以
  src/ 下的 kit 版本为唯一活源码，禁止反向同步）。
- 旧测试保留在 tests/，可用 `npm run test:legacy` 运行（不进入默认门禁）。
- 旧构建脚本在 scripts/，不再维护，不保证可用。
- 已知：tests/LoggerPerformance 是墙钟性能比例测试（日志开销 <5%），
  对机器负载敏感，繁忙时可能单条失败；它不进任何门禁，属环境抖动而非回归。
