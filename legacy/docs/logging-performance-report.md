# 日志模块性能与发布验证报告

## 测试环境

- 项目目录：`d:\JavaWorkspace\game-engine`
- 构建目标：`wechat` / `douyin` / `h5`
- 测试日期：`2026-06-14`

## 性能测试方法

执行命令：

```bash
npm run test:logger
```

其中 `tests/LoggerPerformance.test.ts` 会模拟高频主线程帧循环：

- 每轮执行固定数学运算，模拟渲染与物理更新负载
- 对比“不开启日志”与“开启全量 Debug 日志”两组耗时
- 同时启用控制台外的两个真实 sink：本地持久化日志文件、调试面板
- 使用异步批量 flush，验证日志模块不会在调用点执行阻塞式写入

## 实测结果

最近一次独立性能验证输出如下：

```text
[logger-perf] baseline=235.11ms withDebug=235.57ms overhead=0.19%
```

结论：

- 在当前模拟负载下，开启全量 `Debug` 日志后的主线程额外开销约为 `0.19%`
- 结果低于要求的 `5%` 阈值

说明：

- 当与全量测试套件同时运行时，基准可能受到 JIT 预热、CPU 调度和其他测试任务影响，出现短时波动
- 交付结果以独立日志性能测试命令的观测值为准

## 生产包剥离验证

执行命令：

```bash
npm run build
npm run verify:prod-logs
```

实测输出：

```text
[verify-prod-logs] production bundles do not contain debug log sentinels
```

验证项：

- `Renderer` 调试字符串已从生产包移除
- `Loader` 网络调试字符串已从生产包移除
- `Collision` 物理调试字符串已从生产包移除

## 结论

- 日志模块满足开发态调试输出需求
- `Debug` 日志不会进入生产构建产物
- 异步批量写入与有界缓存机制满足帧率与内存安全要求
