# 游戏引擎使用指南

## 安装

### 方式1：作为npm包安装（推荐）

```bash
npm install lite-game-engine
```

### 方式方式2：本地引用

```json
{
  "dependencies": {
    "lite-game-engine": "file:../../"
  }
}
```

---

## 快速开始

### 1. 创建游戏入口

```typescript
import { Engine, H5Platform, Scene, Node } from 'lite-game-engine';

// 创建引擎实例
const engine = new Engine(new H5Platform());

// 创建场景
class MyScene extends Scene {
  onEnter(): void {
    // 场景初始化
    const node = new Node();
    node.x = 100;
    node.y = 100;
    this.addChild(node);
  }

  protected draw(renderer: any): void {
    // 绘制逻辑
    renderer.ctx.fillStyle = '#ff0000';
    renderer.ctx.fillRect(0, 0, 100, 100);
  }
}

// 启动游戏
engine.setScene(new MyScene());
engine.start();
```

### 2. 使用组件系统

```typescript
import { Component } from 'lite-game-engine';

class MoveComponent extends Component {
  speed = 100;

  onUpdate(dt: number): void {
    this.node.x += this.speed * dt;
  }
}

// 添加组件到节点
const node = new Node();
node.addComponent(new MoveComponent());
```

### 3. 处理输入

```typescript
engine.input.onStart((touches) => {
  console.log('Touch at:', touches[0].x, touches[0].y);
});

engine.input.onMove((touches) => {
  console.log('Move to:', touches[0].x, touches[0].y);
});

engine.input.onEnd(() => {
  console.log('Touch end');
});
```

### 4. 碰撞检测

```typescript
import { Collision, Rect } from 'lite-game-engine';

const rect1: Rect = { x: 0, y: 0, width: 50, height: 50 };
const rect2: Rect = { x: 30, y: 30, width: 50, height: 50 };

if (Collision.rectIntersect(rect1, rect2)) {
  console.log('Collision!');
}
```

### 5. 加载资源

```typescript
// 加载纹理
const texture = await engine.loader.loadTexture('assets/player.png');

// 加载音频
const audio = engine.loader.loadAudio('assets/bgm.mp3');
audio.play(true);

// 加载JSON
const config = await engine.loader.loadJSON('assets/config.json');
```

### 6. 使用UI组件

```typescript
import { Button, UIManager } from 'lite-game-engine';

const uiManager = new UIManager(engine.input);

const button = new Button('点击我', 120, 40);
button.x = 200;
button.y = 300;
button.onClickCallback = () => console.log('Clicked!');
uiManager.addWidget(button);
```

---

## 构建产物

引擎提供三种格式的构建产物：

| 格式 | 文件 | 用途 |
|------|------|------|
| ESM | `dist/lib/index.mjs` | 现代打包工具（Vite、Webpack） |
| CJS | `dist/lib/index.cjs` | Node.js、旧版打包工具 |
| IIFE | `dist/h5/game.h5.js` | 直接在HTML中引用 |

### 使用ESM格式

```typescript
import { Engine, Scene, Node } from 'lite-game-engine';
```

### 使用CJS格式

```javascript
const { Engine, Scene, Node } = require('lite-game-engine');
```

### 使用IIFE格式

```html
<script src="dist/h5/game.h5.js"></script>
<script>
  const engine = new LiteGameEngine.Engine(new LiteGameEngine.H5Platform());
</script>
```

---

## TypeScript类型支持

引擎提供完整的TypeScript类型声明：

```typescript
// dist/types/index.d.ts
export { Engine } from './engine/Engine';
export { Scene } from './engine/core/Scene';
export { Node } from './engine/core/Node';
// ... 更多类型
```

---

## 跨平台使用

### H5网页

```typescript
import { Engine, H5Platform } from 'lite-game-engine';

const engine = new Engine(new H5Platform());
```

### 微信小游戏

```typescript
import { Engine, WxPlatform } from 'lite-game-engine';

const engine = new Engine(new WxPlatform());
```

### 抖音小游戏

```typescript
import { Engine, TtPlatform } from 'lite-game-engine';

const engine = new Engine(new TtPlatform());
```

---

## 示例项目

参考 `examples/basic-game` 目录，包含：

- 完整的游戏示例
- Vite配置
- 项目结构说明

运行示例：

```bash
cd examples/basic-game
npm install
npm run dev
```

---

## API文档

详细的API文档请参考：

- `docs/api/` - API参考手册
- `docs/guides/` - 使用指南
- `README.md` - 引擎概述

---

## 许可证

MIT