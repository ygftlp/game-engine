# 开发环境搭建指南

## 1. 先决条件

- Node.js 18 及以上
- npm 9 及以上
- Git
- 至少一个目标平台调试工具

推荐安装的调试工具：

- H5：Chrome、Edge 或任意现代浏览器
- 微信小游戏：微信开发者工具
- 抖音小游戏：抖音开发者工具

## 2. 获取代码并安装依赖

```bash
git clone <your-repository-url>
cd game-engine
npm install
```

安装完成后可直接使用以下命令：

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run example:build
npm run docs:build
```

## 3. 仓库结构

```text
src/engine    引擎核心
src/entries   三端入口
src/game      示例游戏与场景
src/web       H5 页面壳
tests         单元测试
docs/manual   双语手册源文件
examples      手册配套示例项目
scripts       构建与验证脚本
dist          构建产物
```

## 4. 编译流程

### 生产构建

```bash
npm run build
```

产物输出：

- `dist/wechat/game.js`
- `dist/douyin/game.js`
- `dist/h5/game.h5.js`
- `dist/h5/index.html`

### 开发构建

```bash
npm run watch
```

特点：

- 开启 source map
- `__DEV__ = true`
- 保留 `DEV:` 标记中的调试日志

## 5. 依赖库说明

仓库当前主要依赖如下：

| 依赖 | 用途 |
| --- | --- |
| `typescript` | 类型检查与编译约束 |
| `esbuild` | 三端 bundle 构建 |
| `vitest` | 单元测试 |
| `eslint` | 代码质量检查 |
| `marked` | 文档 HTML 渲染 |
| `pdfkit` | 手册 PDF 生成 |

## 6. 创建工程模板

当前版本是代码驱动工作流，没有图形化工程向导。推荐以下流程创建新项目：

1. 复制 `examples/manual-starter` 作为项目模板
2. 将场景文件放入 `src/game/`
3. 在某个 `src/entries/main.*.ts` 中实例化 `Engine`
4. 注入目标平台适配器并设置初始场景

最小模板如下：

```ts
import { Engine, H5Platform } from '../engine';
import { StarterScene } from '../game/StarterScene';

const engine = new Engine(new H5Platform());
engine.setScene(new StarterScene());
engine.start();
```

## 7. 开发工具安装与启动

### H5 调试

1. 执行 `npm run build`
2. 用任意静态文件服务器托管 `dist/h5`
3. 在浏览器中打开 `index.html`
4. 使用浏览器开发者工具查看性能与控制台日志

### 微信小游戏调试

1. 执行 `npm run build`
2. 用微信开发者工具导入仓库或 `dist/wechat`
3. 确认 `game.json`、`project.config.json` 可被工具识别
4. 使用真机调试、性能面板和存储面板定位问题

### 抖音小游戏调试

1. 执行 `npm run build`
2. 在抖音开发者工具中导入 `dist/douyin`
3. 运行模拟器或真机预览
4. 使用控制台与网络面板定位问题

## 8. 配套开发工具说明

用户原始需求中提到的场景编辑器、材质编辑器、动画编辑器、性能分析器在当前仓库中并未内置。建议采用下列替代方案：

| 需求 | 当前方案 |
| --- | --- |
| 场景编辑 | 代码定义节点树与 UI |
| 材质编辑 | 直接在 Canvas 绘制逻辑中配置颜色、纹理和透明度 |
| 动画编辑 | 使用 `AnimationClip` 与 `Animator` 通过代码配置 |
| 性能分析 | 浏览器 DevTools、小游戏开发者工具、引擎 Logger 面板 |

## 9. 文档构建

```bash
npm run docs:clean
npm run docs:build
```

文档输出目录：

- `dist/docs/index.html`
- `dist/docs/zh-CN/*.html`
- `dist/docs/en-US/*.html`
- `dist/docs/pdf/zh-CN-manual.pdf`
- `dist/docs/pdf/en-US-manual.pdf`

## 10. 示例项目构建

```bash
npm run example:build
```

示例产物输出到：

- `dist/examples/manual-starter/index.html`
- `dist/examples/manual-starter/main.js`

该示例与教程文档保持同步，适合用于验证引擎最小接入流程。

## 11. 推荐校验流程

在提交代码前建议执行：

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run example:build
npm run docs:build
```
