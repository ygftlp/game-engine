# Lite Game Engine 大模型接入与应用方案

**版本**: 1.0.0  
**更新日期**: 2026年6月14日  
**适用对象**: 各类大语言模型（LLM）

---

## 一、核心能力清单

### 1.1 引擎架构概述

```
┌─────────────────────────────────────────────────────────────┐
│                      游戏层 (Game Layer)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   场景管理   │  │   游戏逻辑   │  │   UI界面 / Demo     │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                    引擎核心层 (Engine Core)                    │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐   │
│  │Renderer│ │  Input │ │ Loader │ │ Audio  │ │Collider│   │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘   │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐   │
│  │ Ticker │ │  Node  │ │ Scene  │ │  Math  │ │   UI   │   │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘   │
├─────────────────────────────────────────────────────────────┤
│                   平台适配层 (Platform Layer)                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ WxPlatform  │  │ TtPlatform  │  │    H5Platform       │ │
│  │  (微信)      │  │  (抖音)      │  │    (浏览器)         │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 核心模块能力矩阵

| 模块 | 能力 | API示例 | 完成度 |
|------|------|---------|--------|
| **渲染系统** | Canvas 2D渲染、精灵绘制、动画系统 | `new Sprite(texture)` | ✅ 100% |
| **输入系统** | 触摸/鼠标事件、多点触控 | `engine.input.onStart(fn)` | ✅ 100% |
| **资源管理** | 图片/音频/JSON加载、LRU缓存 | `loader.loadTexture(url)` | ✅ 100% |
| **场景管理** | 场景栈、生命周期 | `engine.setScene(scene)` | ✅ 100% |
| **碰撞检测** | AABB、圆形、矩形-圆形 | `Collision.rectIntersect(a,b)` | ✅ 100% |
| **UI系统** | 按钮、标签、进度条、对话框 | `new Button(text, w, h)` | ✅ 100% |
| **动画系统** | 帧动画、图集动画 | `new AnimationClip(config)` | ✅ 100% |
| **数学库** | Vec2、Matrix2D | `new Vec2(x, y)` | ✅ 100% |
| **工具集** | 日志、定时器、存储、对象池 | `new TimerManager()` | ✅ 100% |
| **安全区适配** | 微信/抖音导航栏适配 | `new SafeAreaAdapter()` | ✅ 100% |

### 1.3 平台支持矩阵

| 平台 | 状态 | 适配器 | 构建产物 |
|------|------|--------|----------|
| **微信小游戏** | ✅ 正式支持 | `WxPlatform` | `dist/wechat/game.js` |
| **抖音小游戏** | ✅ 正式支持 | `TtPlatform` | `dist/douyin/game.js` |
| **H5网页** | ✅ 正式支持 | `H5Platform` | `dist/h5/game.h5.js` |

---

## 二、大模型交互接口规范

### 2.1 核心API速查表

#### 引擎初始化

```typescript
// 创建引擎实例
import { Engine, H5Platform, WxPlatform, TtPlatform } from 'lite-game-engine';

// H5平台
const engine = new Engine(new H5Platform());

// 微信平台
const engine = new Engine(new WxPlatform());

// 抖音平台
const engine = new Engine(new TtPlatform());
```

#### 场景管理

```typescript
// 创建场景
class MyScene extends Scene {
  onEnter(): void {}   // 进入场景
  onExit(): void {}    // 退出场景
  update(dt: number): void {}  // 每帧更新
  protected draw(renderer: Renderer): void {}  // 渲染
}

// 使用场景
engine.setScene(new MyScene());    // 替换场景
engine.pushScene(new MyScene());   // 压入场景栈
engine.popScene();                 // 弹出当前场景
```

#### 节点系统

```typescript
// 创建节点
const node = new Node();
node.x = 100;           // X坐标
node.y = 200;           // Y坐标
node.width = 50;        // 宽度
node.height = 50;       // 高度
node.rotation = 0.5;    // 旋转（弧度）
node.scaleX = 2;        // X缩放
node.scaleY = 2;        // Y缩放
node.alpha = 0.8;       // 透明度（0-1）
node.zIndex = 10;       // 层级
node.visible = true;    // 是否可见

// 节点操作
parent.addChild(node);          // 添加子节点
node.removeFromParent();        // 从父节点移除
node.addComponent(component);   // 添加组件
node.destroy();                 // 销毁节点
```

#### 组件系统

```typescript
// 创建自定义组件
class MyComponent extends Component {
  onAttach(): void {}    // 组件被添加时
  onUpdate(dt: number): void {}  // 每帧更新
  onDetach(): void {}    // 组件被移除时
}

// 使用组件
node.addComponent(new MyComponent());
const comp = node.getComponent(MyComponent);
node.removeComponent(comp);
```

#### 输入处理

```typescript
// 触摸/鼠标按下
engine.input.onStart((touches) => {
  console.log('Touch at:', touches[0].x, touches[0].y);
});

// 触摸/鼠标移动
engine.input.onMove((touches) => {
  console.log('Move to:', touches[0].x, touches[0].y);
});

// 触摸/鼠标抬起
engine.input.onEnd((touches) => {
  console.log('Touch end');
});

// 返回取消函数
const off = engine.input.onStart(handler);
off(); // 取消监听
```

#### 碰撞检测

```typescript
import { Collision, Rect, Circle } from 'lite-game-engine';

// 矩形碰撞
const rect1: Rect = { x: 0, y: 0, width: 50, height: 50 };
const rect2: Rect = { x: 30, y: 30, width: 50, height: 50 };
Collision.rectIntersect(rect1, rect2);  // true

// 圆形碰撞
const circle1: Circle = { x: 0, y: 0, radius: 25 };
const circle2: Circle = { x: 30, y: 0, radius: 25 };
Collision.circleIntersect(circle1, circle2);  // true

// 矩形-圆形碰撞
Collision.rectCircleIntersect(rect1, circle1);  // true

// 点在矩形内
Collision.pointInRect(10, 10, rect1);  // true
```

#### 资源加载

```typescript
// 加载纹理
const texture = await engine.loader.loadTexture('assets/player.png');

// 加载音频
const audio = engine.loader.loadAudio('assets/bgm.mp3');
audio.play(true);  // 循环播放
audio.volume = 0.5;

// 加载JSON
const config = await engine.loader.loadJSON<Config>('assets/config.json');

// 批量加载
await engine.loader.loadAll([
  { url: 'assets/player.png', type: 'texture' },
  { url: 'assets/enemy.png', type: 'texture' },
], (loaded, total) => {
  console.log(`Loading: ${loaded}/${total}`);
});
```

#### UI组件

```typescript
import { Button, Label, ProgressBar, Dialog, UIManager } from 'lite-game-engine';

// 创建UI管理器
const uiManager = new UIManager(engine.input);

// 按钮
const button = new Button('点击我', 120, 40);
button.x = 200;
button.y = 300;
button.onClickCallback = () => console.log('Clicked!');
uiManager.addWidget(button);

// 标签
const label = new Label('Hello World', 200, 30);
label.font = 'bold 24px sans-serif';
label.color = '#ffffff';

// 进度条
const progressBar = new ProgressBar(200, 20);
progressBar.value = 0.75;

// 对话框
const dialog = new Dialog(300, 200);
dialog.setTitle('提示');
dialog.setContent('确定要退出吗？');
dialog.addButton('取消');
dialog.addButton('确定', () => console.log('confirmed'));
dialog.show();
```

#### 动画系统

```typescript
import { AnimationClip, Animator, createAtlasAnimationClip } from 'lite-game-engine';

// 创建动画剪辑
const walkClip = new AnimationClip({
  name: 'walk',
  frames: [
    { x: 0, y: 0, width: 64, height: 64 },
    { x: 64, y: 0, width: 64, height: 64 },
    { x: 128, y: 0, width: 64, height: 64 },
    { x: 192, y: 0, width: 64, height: 64 },
  ],
  fps: 12,
  mode: 'loop',
});

// 使用工厂方法
const clip = createAtlasAnimationClip('walk', texture, 64, 64, 4, 12, 'loop');

// 动画控制器
const animator = new Animator();
animator.addClip(walkClip);
sprite.addComponent(animator);
animator.play('walk');
```

---

## 三、从0到1游戏构建分步指南

### 3.1 项目初始化

```bash
# 1. 克隆引擎
git clone <repo-url>
cd lite-game-engine

# 2. 安装依赖
npm install

# 3. 构建引擎
npm run build

# 4. 创建游戏目录
mkdir -p src/game/my-game
```

### 3.2 创建游戏入口

```typescript
// src/game/my-game/main.ts
import { Engine, H5Platform, Scene, Node, Collision, Rect } from '../../engine';

// 创建引擎
const engine = new Engine(new H5Platform());
engine.backgroundColor = '#1a1a2e';

// 定义游戏配置
const CONFIG = {
  width: 375,
  height: 667,
  playerSpeed: 200,
};
```

### 3.3 创建游戏场景

```typescript
// 创建游戏场景
class GameScene extends Scene {
  private player!: Node;
  private score = 0;

  onEnter(): void {
    // 创建玩家
    this.player = new Node();
    this.player.x = CONFIG.width / 2;
    this.player.y = CONFIG.height * 0.8;
    this.player.width = 50;
    this.player.height = 50;
    this.addChild(this.player);

    // 绑定输入
    engine.input.onMove((touches) => {
      if (touches.length > 0) {
        this.player.x = touches[0].x;
      }
    });
  }

  update(dt: number): void {
    // 游戏逻辑更新
  }

  protected draw(renderer: any): void {
    const ctx = renderer.ctx;
    
    // 背景
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);

    // 玩家
    ctx.fillStyle = '#4ecdc4';
    ctx.fillRect(
      this.player.x - 25,
      this.player.y - 25,
      50,
      50
    );

    // 分数
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`分数: ${this.score}`, CONFIG.width / 2, 40);
  }
}
```

### 3.4 启动游戏

```typescript
// 启动游戏
engine.setScene(new GameScene());
engine.start();
```

### 3.5 构建和运行

```bash
# 开发模式（watch）
npm run watch

# 构建三端
npm run build

# 运行测试
npm test

# 类型检查
npm run typecheck
```

---

## 四、实战案例

### 4.1 休闲小游戏：Flappy Bird

```typescript
class FlappyBirdScene extends Scene {
  private birdY = 300;
  private birdVelocity = 0;
  private pipes: Array<{ x: number; gapY: number }> = [];
  private score = 0;
  private gameOver = false;
  private started = false;

  onEnter(): void {
    engine.input.onStart(() => {
      if (this.gameOver) {
        this.restart();
        return;
      }
      if (!this.started) {
        this.started = true;
      }
      this.birdVelocity = -300;
    });
  }

  private restart(): void {
    this.birdY = 300;
    this.birdVelocity = 0;
    this.pipes = [];
    this.score = 0;
    this.gameOver = false;
    this.started = false;
  }

  update(dt: number): void {
    if (this.gameOver || !this.started) return;

    // 物理
    this.birdVelocity += 800 * dt;
    this.birdY += this.birdVelocity * dt;

    // 生成管道
    if (Math.random() < dt * 0.5) {
      this.pipes.push({
        x: 400,
        gapY: 100 + Math.random() * 300,
      });
    }

    // 移动管道
    for (const pipe of this.pipes) {
      pipe.x -= 150 * dt;
    }

    // 碰撞检测
    const birdRect: Rect = { x: 60 - 15, y: this.birdY - 15, width: 30, height: 30 };
    for (const pipe of this.pipes) {
      const topRect: Rect = { x: pipe.x - 25, y: 0, width: 50, height: pipe.gapY - 70 };
      const bottomRect: Rect = { x: pipe.x - 25, y: pipe.gapY + 70, width: 50, height: 600 };
      if (Collision.rectIntersect(birdRect, topRect) || 
          Collision.rectIntersect(birdRect, bottomRect)) {
        this.gameOver = true;
      }
    }

    if (this.birdY < 0 || this.birdY > 600) {
      this.gameOver = true;
    }
  }

  protected draw(renderer: any): void {
    const ctx = renderer.ctx;
    
    // 背景
    ctx.fillStyle = '#4ec0ca';
    ctx.fillRect(0, 0, 400, 600);

    // 管道
    ctx.fillStyle = '#2ecc71';
    for (const pipe of this.pipes) {
      ctx.fillRect(pipe.x - 25, 0, 50, pipe.gapY - 70);
      ctx.fillRect(pipe.x - 25, pipe.gapY + 70, 50, 600);
    }

    // 小鸟
    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.arc(60, this.birdY, 15, 0, Math.PI * 2);
    ctx.fill();

    // 分数
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(this.score), 200, 50);
  }
}
```

### 4.2 益智游戏：2048

```typescript
class Game2048Scene extends Scene {
  private grid: number[][] = [];
  private score = 0;
  private startX = 0;
  private startY = 0;

  onEnter(): void {
    this.grid = Array(4).fill(null).map(() => Array(4).fill(0));
    this.spawnTile();
    this.spawnTile();

    engine.input.onStart((touches) => {
      this.startX = touches[0].x;
      this.startY = touches[0].y;
    });

    engine.input.onEnd((touches) => {
      const dx = touches[0].x - this.startX;
      const dy = touches[0].y - this.startY;
      if (Math.abs(dx) < 30 && Math.abs(dy) < 30) return;

      if (Math.abs(dx) > Math.abs(dy)) {
        this.move(dx > 0 ? 'right' : 'left');
      } else {
        this.move(dy > 0 ? 'down' : 'up');
      }
    });
  }

  private spawnTile(): void {
    const empty: Array<{ r: number; c: number }> = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (this.grid[r][c] === 0) empty.push({ r, c });
      }
    }
    if (empty.length === 0) return;
    const pos = empty[Math.floor(Math.random() * empty.length)];
    this.grid[pos.r][pos.c] = Math.random() < 0.9 ? 2 : 4;
  }

  private move(dir: string): void {
    // 移动逻辑...
    this.spawnTile();
  }

  protected draw(renderer: any): void {
    const ctx = renderer.ctx;
    const cellSize = 80;
    const startX = (400 - cellSize * 4 - 30) / 2;
    const startY = 120;

    // 网格背景
    ctx.fillStyle = '#bbada0';
    ctx.fillRect(startX - 5, startY - 5, cellSize * 4 + 35, cellSize * 4 + 35);

    // 单元格
    const colors: Record<number, string> = {
      0: '#cdc1b4', 2: '#eee4da', 4: '#ede0c8', 8: '#f2b179',
      16: '#f59563', 32: '#f67c5f', 64: '#f65e3b', 128: '#edcf72',
      256: '#edcc61', 512: '#edc850', 1024: '#edc53f', 2048: '#edc22e',
    };

    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const val = this.grid[r][c];
        const x = startX + c * (cellSize + 10);
        const y = startY + r * (cellSize + 10);

        ctx.fillStyle = colors[val] || '#3c3a32';
        ctx.fillRect(x, y, cellSize, cellSize);

        if (val > 0) {
          ctx.fillStyle = val <= 4 ? '#776e65' : '#f9f6f2';
          ctx.font = 'bold 28px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(val), x + cellSize / 2, y + cellSize / 2);
        }
      }
    }
  }
}
```

### 4.3 动作游戏：打砖块

```typescript
class BreakoutScene extends Scene {
  private paddleX = 200;
  private ballX = 200;
  private ballY = 500;
  private ballVX = 200;
  private ballVY = -300;
  private bricks: Array<{ x: number; y: number; alive: boolean }> = [];
  private score = 0;

  onEnter(): void {
    // 初始化砖块
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 8; c++) {
        this.bricks.push({
          x: 20 + c * 45 + 22,
          y: 60 + r * 25 + 12,
          alive: true,
        });
      }
    }

    // 输入控制
    engine.input.onMove((touches) => {
      this.paddleX = Math.max(50, Math.min(350, touches[0].x));
    });
  }

  update(dt: number): void {
    // 球移动
    this.ballX += this.ballVX * dt;
    this.ballY += this.ballVY * dt;

    // 墙壁碰撞
    if (this.ballX < 10 || this.ballX > 390) this.ballVX = -this.ballVX;
    if (this.ballY < 10) this.ballVY = -this.ballVY;

    // 挡板碰撞
    if (this.ballY > 540 && Math.abs(this.ballX - this.paddleX) < 60) {
      this.ballVY = -Math.abs(this.ballVY);
      this.ballVX = (this.ballX - this.paddleX) * 4;
    }

    // 砖块碰撞
    for (const brick of this.bricks) {
      if (!brick.alive) continue;
      if (Math.abs(this.ballX - brick.x) < 22 && 
          Math.abs(this.ballY - brick.y) < 12) {
        brick.alive = false;
        this.ballVY = -this.ballVY;
        this.score += 10;
      }
    }
  }

  protected draw(renderer: any): void {
    const ctx = renderer.ctx;

    // 背景
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, 400, 600);

    // 砖块
    const colors = ['#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#3498db'];
    for (const brick of this.bricks) {
      if (!brick.alive) continue;
      const row = Math.floor((brick.y - 60) / 25);
      ctx.fillStyle = colors[row % colors.length];
      ctx.fillRect(brick.x - 20, brick.y - 10, 40, 20);
    }

    // 挡板
    ctx.fillStyle = '#ecf0f1';
    ctx.fillRect(this.paddleX - 50, 550, 100, 15);

    // 球
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(this.ballX, this.ballY, 8, 0, Math.PI * 2);
    ctx.fill();

    // 分数
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`分数: ${this.score}`, 200, 30);
  }
}
```

---

## 五、能力适配清单

### 5.1 不同规模大模型适配建议

| 模型规模 | 推荐功能 | 复杂度限制 | 优化建议 |
|----------|----------|------------|----------|
| **小型 (< 7B)** | 基础渲染、简单碰撞、单场景 | 节点数 < 50 | 使用模板代码，避免复杂逻辑 |
| **中型 (7-13B)** | 完整UI系统、动画、多场景 | 节点数 < 200 | 模块化设计，分步实现 |
| **大型 (> 13B)** | 全部功能、复杂游戏逻辑 | 无限制 | 可实现完整游戏 |

### 5.2 功能复杂度分级

| 复杂度 | 功能 | 代码行数 | 适用模型 |
|--------|------|----------|----------|
| **简单** | 基础渲染、点击交互 | < 100 | 小型 |
| **中等** | 碰撞检测、动画、UI | 100-500 | 中型 |
| **复杂** | 物理模拟、AI、网络 | > 500 | 大型 |

---

## 六、测试验证方案

### 6.1 单模块功能测试

```typescript
// 测试节点系统
describe('Node', () => {
  it('should add and remove children', () => {
    const parent = new Node();
    const child = new Node();
    parent.addChild(child);
    expect(parent.children).toContain(child);
    child.removeFromParent();
    expect(parent.children).not.toContain(child);
  });

  it('should handle component lifecycle', () => {
    const node = new Node();
    const comp = new TestComponent();
    node.addComponent(comp);
    expect(comp.onAttach).toHaveBeenCalled();
    node.removeComponent(comp);
    expect(comp.onDetach).toHaveBeenCalled();
  });
});
```

### 6.2 全流程游戏构建测试

```typescript
// 测试完整游戏流程
describe('Game Flow', () => {
  it('should create engine and run scene', () => {
    const engine = new Engine(new H5Platform());
    const scene = new TestScene();
    engine.setScene(scene);
    engine.start();
    expect(scene.onEnter).toHaveBeenCalled();
  });

  it('should handle scene transitions', () => {
    const engine = new Engine(new H5Platform());
    const scene1 = new Scene1();
    const scene2 = new Scene2();
    engine.setScene(scene1);
    engine.setScene(scene2);
    expect(scene1.onExit).toHaveBeenCalled();
    expect(scene2.onEnter).toHaveBeenCalled();
  });
});
```

### 6.3 性能压测

```typescript
// 性能测试
describe('Performance', () => {
  it('should handle 1000 nodes at 60fps', () => {
    const engine = new Engine(new H5Platform());
    const scene = new PerformanceScene();
    
    // 创建1000个节点
    for (let i = 0; i < 1000; i++) {
      const node = new Node();
      node.x = Math.random() * 400;
      node.y = Math.random() * 600;
      scene.addChild(node);
    }
    
    engine.setScene(scene);
    engine.start();
    
    // 验证帧率
    // ...
  });
});
```

---

## 七、快速参考卡片

### 核心类速查

| 类 | 用途 | 关键方法 |
|----|------|----------|
| `Engine` | 引擎主控制器 | `setScene()`, `start()`, `destroy()` |
| `Scene` | 场景基类 | `onEnter()`, `onExit()`, `update()`, `draw()` |
| `Node` | 节点基类 | `addChild()`, `addComponent()`, `destroy()` |
| `Component` | 组件基类 | `onAttach()`, `onUpdate()`, `onDetach()` |
| `Sprite` | 精灵节点 | `setTexture()`, `setFrame()` |
| `Input` | 输入系统 | `onStart()`, `onMove()`, `onEnd()` |
| `Loader` | 资源加载 | `loadTexture()`, `loadAudio()`, `loadJSON()` |
| `Collision` | 碰撞检测 | `rectIntersect()`, `circleIntersect()` |

### 常用代码模板

```typescript
// 1. 创建游戏
const engine = new Engine(new H5Platform());

// 2. 创建场景
class GameScene extends Scene {
  onEnter(): void { /* 初始化 */ }
  update(dt: number): void { /* 逻辑更新 */ }
  protected draw(renderer: any): void { /* 渲染 */ }
}

// 3. 启动游戏
engine.setScene(new GameScene());
engine.start();
```

---

**文档版本历史**

| 版本 | 日期 | 修改内容 |
|------|------|----------|
| 1.0.0 | 2026-06-14 | 初始版本发布 |