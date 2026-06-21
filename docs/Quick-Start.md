# 快速入门指南

> 版本：2.0.0  
> 最后更新：2026-06-17

---

## 1. 安装

```bash
npm install gamex-engine
```

## 2. Canvas 画布基础

Canvas 是引擎的渲染载体，由平台适配器自动创建。

```typescript
import { Engine, H5Platform } from 'gamex-engine';

// 创建平台适配器（自动创建 Canvas）
const platform = new H5Platform();
const engine = new Engine(platform);

// Canvas 尺寸信息
console.log('画布尺寸:', engine.width, '×', engine.height);

// 屏幕信息
const screen = platform.getScreenInfo();
console.log('逻辑尺寸:', screen.width, '×', screen.height);
console.log('像素比:', screen.pixelRatio);
```

### Canvas 坐标系

```
原点 (0,0) 在左上角
  ┌──────────────────────────┐
  │                          │
  │     Canvas 画布           │
  │     x →                  │
  │     ↓ y                  │
  │                          │
  └──────────────────────────┘
```

### 多分辨率适配

```typescript
import { ResolutionScaler } from 'gamex-engine';

// 设计分辨率
const scaler = new ResolutionScaler(750, 1334, 'fixed-height');
const result = scaler.calculate(platform.getScreenInfo());

// 应用适配
const ctx = renderer.ctx;
ctx.translate(result.offsetX, result.offsetY);
ctx.scale(result.scale, result.scale);
```

## 3. 最小示例

```typescript
import { Engine, Scene, Sprite, Texture, Input } from 'gamex-engine';

// 1. 创建平台适配器（自动创建 Canvas）
import { H5Platform } from 'gamex-engine';
const platform = new H5Platform();

// 2. 创建引擎
const engine = new Engine(platform);

// 3. 创建场景
class GameScene extends Scene {
  private hero!: Sprite;
  
  onEnter(): void {
    // 加载纹理
    const img = platform.createImage();
    img.src = 'hero.png';
    img.onload = () => {
      const texture = new Texture(img);
      this.hero = new Sprite(texture);
      this.hero.x = 100;
      this.hero.y = 200;
      this.addChild(this.hero);
    };
  }
  
  update(dt: number): void {
    if (this.hero) {
      this.hero.x += 100 * dt;
    }
  }
}

// 4. 启动
engine.setScene(new GameScene());
engine.start();
```

## 3. 使用 UI

```typescript
import { UIManager, Button, Label } from 'gamex-engine';

const uiManager = new UIManager(engine.input);

// 创建按钮
const startBtn = new Button('开始游戏', 200, 50);
startBtn.x = 275;
startBtn.y = 400;
startBtn.onClickCallback = () => {
  console.log('游戏开始');
};

// 创建标签
const title = new Label('我的游戏', 400, 60);
title.font = 'bold 36px sans-serif';
title.x = 175;
title.y = 200;

// 添加到管理器
uiManager.addWidget(title);
uiManager.addWidget(startBtn);
```

## 4. 使用物理

```typescript
import { PhysicsWorld, RigidBody } from 'gamex-engine';

// 创建物理世界
const world = new PhysicsWorld({
  gravity: { x: 0, y: 980 },
});

// 创建地面（静态）
const ground = new RigidBody({
  type: 'static',
  shape: { type: 'rect', width: 800, height: 50 },
  x: 400,
  y: 550,
});
world.addBody(ground);

// 创建球（动态）
const ball = new RigidBody({
  type: 'dynamic',
  shape: { type: 'circle', radius: 20 },
  x: 400,
  y: 100,
  restitution: 0.7,
});
world.addBody(ball);

// 游戏循环
function update(dt: number) {
  world.step(dt);
  ballSprite.x = ball.position.x;
  ballSprite.y = ball.position.y;
}
```

## 5. 使用音频

```typescript
import { AudioManager } from 'gamex-engine';

const audioMgr = new AudioManager(platform);

// 播放背景音乐
const bgm = audioMgr.createAudio('music');
bgm.load('bgm.mp3');
bgm.play(true);

// 播放音效
const sfx = audioMgr.createAudio('sfx');
sfx.load('hit.mp3');
sfx.play();

// 音量控制
audioMgr.setCategoryVolume('music', 0.5);
audioMgr.muteCategory('sfx');
```

## 6. 使用 AI

```typescript
import { BehaviorTree, Sequence, Condition, Action, NodeStatus } from 'gamex-engine';

const enemyAI = new BehaviorTree(
  new Sequence('EnemyBehavior', [
    new Condition('HasTarget', (bb) => bb.has('target')),
    new Action('Chase', (bb) => {
      const target = bb.get('target');
      // 追击逻辑
      return NodeStatus.RUNNING;
    }),
  ])
);

// 每帧更新
enemyAI.blackboard.set('target', player);
enemyAI.tick();
```

## 7. 使用网络

```typescript
import { WebSocketClient } from 'gamex-engine';

const ws = new WebSocketClient({
  url: 'wss://game-server.com/ws',
  autoReconnect: true,
});

ws.on('open', () => {
  console.log('已连接服务器');
});

ws.on('message', (msg) => {
  if (msg.type === 'state') {
    // 更新游戏状态
    updateGameState(msg.data);
  }
});

await ws.connect();
ws.send({ type: 'input', data: { moveX: 1 } });
```

## 8. 使用存档

```typescript
import { SaveManager } from 'gamex-engine';

const saveMgr = new SaveManager(platform);

// 保存
saveMgr.save(0, {
  version: 1,
  timestamp: Date.now(),
  gameState: { level: 5, score: 1000 },
  playerData: { hp: 100 },
  levelData: {},
  stats: {},
});

// 加载
const data = saveMgr.load(0);
if (data) {
  restoreGameState(data.gameState);
}
```

## 9. 多平台构建

```bash
# 构建微信小游戏
npm run build

# 输出目录
dist/wechat/game.js   # 微信
dist/douyin/game.js   # 抖音
dist/h5/game.h5.js    # H5
```

## 10. 项目结构

```
game-engine/
├── src/
│   ├── engine/           # 引擎核心
│   │   ├── core/         # 核心系统（Node, Scene, Component）
│   │   ├── render/       # 渲染系统（Sprite, Texture, Animation）
│   │   ├── render3d/     # 3D 渲染（Material, Light, Mesh）
│   │   ├── ui/           # UI 系统（Button, Label, ScrollView）
│   │   ├── audio/        # 音频系统（AudioManager, SpatialAudio）
│   │   ├── physics/      # 物理系统（RigidBody, PhysicsWorld）
│   │   ├── effects/      # 特效系统（Particle, Tween）
│   │   ├── ai/           # AI 系统（BehaviorTree, FSM, Pathfinding）
│   │   ├── network/      # 网络系统（WebSocket, HttpClient）
│   │   ├── game/         # 游戏框架（SaveManager, ScoreManager）
│   │   ├── math/         # 数学库（Vec2, Vec3, Mat4, Quat）
│   │   ├── utils/        # 工具类（Logger, Timer, Storage）
│   │   ├── platform/     # 平台适配（WxPlatform, TtPlatform, H5Platform）
│   │   └── index.ts      # 统一导出
│   ├── entries/          # 平台入口
│   └── game/             # 示例游戏
├── tests/                # 单元测试
├── docs/                 # 文档
└── scripts/              # 构建脚本
```

## 下一步

- [API 参考文档](./API-Reference.md)
- [UI 布局系统文档](./UI-Layout-System.md)
- [能力评估报告](./engine-capability-assessment.md)
