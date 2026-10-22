# GameX Engine API 文档

> 版本：2.0.0  
> 最后更新：2026-06-17  
> 引擎定位：轻量级 Canvas 2D/3D 游戏引擎（微信/抖音/H5 小游戏）

---

## 目录

1. [核心系统](#1-核心系统)
2. [渲染系统](#2-渲染系统)
3. [UI 系统](#3-ui-系统)
4. [音频系统](#4-音频系统)
5. [物理系统](#5-物理系统)
6. [动画系统](#6-动画系统)
7. [特效系统](#7-特效系统)
8. [AI 系统](#8-ai-系统)
9. [网络系统](#9-网络系统)
10. [游戏框架](#10-游戏框架)
11. [3D 渲染](#11-3d-渲染)
12. [数学库](#12-数学库)
13. [工具类](#13-工具类)
14. [平台适配](#14-平台适配)
15. [移动端事件](#15-移动端事件)

---

## 1. 核心系统

### Engine 引擎主控制器

```typescript
import { Engine } from 'gamex-engine';

const engine = new Engine(platform);
engine.start();
engine.destroy();
```

| 方法 | 说明 |
|------|------|
| `setScene(scene)` | 设置当前场景 |
| `pushScene(scene)` | 压入新场景 |
| `popScene()` | 弹出当前场景 |
| `start()` | 启动引擎 |
| `destroy()` | 销毁引擎，清理所有资源 |

### Node 场景节点

```typescript
import { Node } from 'gamex-engine';

const node = new Node();
node.x = 100;
node.y = 200;
node.scaleX = 2;
node.rotation = Math.PI / 4;
node.alpha = 0.5;
node.zIndex = 10;

node.addChild(childNode);
node.addComponent(myComponent);
node.hitTest(worldX, worldY);
node.destroy();
```

### Scene 场景

```typescript
import { Scene } from 'gamex-engine';

class MyScene extends Scene {
  onEnter(): void { /* 场景进入 */ }
  onExit(): void { /* 场景退出 */ }
  update(dt: number): void { /* 每帧更新 */ }
}
```

### Component 组件基类

```typescript
import { Component } from 'gamex-engine';

class MoveComponent extends Component {
  speed = 100;
  
  onAttach(): void { /* 挂载到节点 */ }
  onUpdate(dt: number): void { /* 每帧更新 */ }
  onDetach(): void { /* 从节点移除 */ }
}

node.addComponent(new MoveComponent());
```

### SceneManager 场景管理器

```typescript
const sm = engine.sceneManager;
sm.push(scene);      // 压入场景
sm.pop();            // 弹出场景
sm.replace(scene);   // 替换场景
sm.clear();          // 清空场景栈
sm.onChange((old, next) => { /* 场景切换回调 */ });
```

### EventEmitter 事件系统

```typescript
import { EventEmitter } from 'gamex-engine';

const emitter = new EventEmitter();
emitter.on('damage', (amount) => { /* 处理伤害 */ });
emitter.emit('damage', 100);
emitter.off('damage', handler);
emitter.once('death', () => { /* 只触发一次 */ });
```

### Pool 对象池

```typescript
import { Pool } from 'gamex-engine';

const bulletPool = new Pool(
  () => new Bullet(),           // 工厂函数
  (b) => { b.reset(); },       // 重置函数
  100,                          // 最大容量
  20                            // 初始预分配
);

const bullet = bulletPool.acquire();
bulletPool.release(bullet);
```

---

## 2. 渲染系统

### Canvas 画布

Canvas 是引擎的渲染载体，通过平台适配器创建，与具体平台解耦。

```typescript
import { Engine, IPlatform } from 'gamex-engine';

// Canvas 由平台适配器自动创建
const engine = new Engine(platform);

// 获取 Canvas 尺寸
console.log(engine.width);   // 画布宽度（物理像素）
console.log(engine.height);  // 画布高度（物理像素）

// Canvas 配置（通过平台）
const screen = platform.getScreenInfo();
console.log(screen.width);       // 逻辑宽度
console.log(screen.height);      // 逻辑高度
console.log(screen.pixelRatio);  // 设备像素比
```

#### 平台创建 Canvas

| 平台 | 创建方式 | 说明 |
|------|---------|------|
| H5 | `document.createElement('canvas')` | 浏览器原生 Canvas |
| 微信 | `wx.createCanvas()` | 小游戏专用 Canvas |
| 抖音 | `tt.createCanvas()` | 小游戏专用 Canvas |

#### Canvas 坐标系

```
原点 (0,0)
  ┌──────────────────────────┐
  │                          │
  │     Canvas 画布           │
  │     (width × height)     │
  │                          │
  └──────────────────────────┘
                          (width, height)
```

#### Canvas 状态管理

```typescript
// Renderer 自动管理 Canvas 状态
renderer.clear('#000000');  // 清屏（重置变换和 alpha）
renderer.ctx.save();        // 保存状态
renderer.ctx.restore();     // 恢复状态
```

#### 多分辨率适配

```typescript
import { ResolutionScaler } from 'gamex-engine';

// 设计分辨率 750×1334（iPhone 6/7/8）
const scaler = new ResolutionScaler(750, 1334, 'fixed-height');

// 计算适配结果
const result = scaler.calculate(platform.getScreenInfo());
// result.scale    - 缩放比例
// result.offsetX  - 水平偏移（居中）
// result.offsetY  - 垂直偏移（居中）

// 应用到 Canvas
const ctx = renderer.ctx;
ctx.setTransform(1, 0, 0, 1, 0, 0);
ctx.translate(result.offsetX, result.offsetY);
ctx.scale(result.scale, result.scale);

// 坐标转换
const designPos = scaler.screenToDesign(screenX, screenY, screenInfo);
const screenPos = scaler.designToScreen(designX, designY, screenInfo);
```

#### Canvas 2D Context

```typescript
// 直接访问 Canvas 2D Context（高级用法）
const ctx = renderer.ctx;

// 绘制矩形
ctx.fillStyle = '#ff0000';
ctx.fillRect(0, 0, 100, 50);

// 绘制圆形
ctx.beginPath();
ctx.arc(50, 50, 25, 0, Math.PI * 2);
ctx.fill();

// 绘制文本
ctx.font = '24px sans-serif';
ctx.fillStyle = '#ffffff';
ctx.fillText('Hello', 10, 30);

// 绘制图片
ctx.drawImage(image, 0, 0, 100, 100);

// 变换
ctx.translate(100, 100);
ctx.rotate(Math.PI / 4);
ctx.scale(2, 2);

// 透明度
ctx.globalAlpha = 0.5;

// 裁剪
ctx.beginPath();
ctx.rect(0, 0, 200, 200);
ctx.clip();
```

#### Canvas 与 WebGL

```typescript
import { WebGLRenderer } from 'gamex-engine';

// WebGL 渲染器（可选，用于 3D 或高级效果）
const canvas = document.getElementById('game') as HTMLCanvasElement;
const glRenderer = new WebGLRenderer(canvas);

// WebGL 上下文
const gl = glRenderer.gl;
gl.clearColor(0.1, 0.1, 0.15, 1);
gl.clear(gl.COLOR_BUFFER_BIT);
```

### Renderer 渲染器

```typescript
import { Renderer } from 'gamex-engine';

renderer.clear('#000000');
renderer.drawRect(x, y, w, h, color);
renderer.drawText(text, x, y, color, font);
```

### Sprite 精灵

```typescript
import { Sprite, Texture } from 'gamex-engine';

const sprite = new Sprite(texture);
sprite.width = 64;
sprite.height = 64;
sprite.anchorX = 0.5;
sprite.anchorY = 0.5;
sprite.frame = { x: 0, y: 0, width: 32, height: 32 };
```

### Texture 纹理

```typescript
import { Texture } from 'gamex-engine';

const tex = new Texture(image);
console.log(tex.loaded);  // 是否加载完成
console.log(tex.width);   // 宽度
console.log(tex.height);  // 高度
```

### SpriteBatch 渲染批处理

```typescript
import { SpriteBatch } from 'gamex-engine';

const batch = new SpriteBatch(renderer);
batch.begin();
for (const sprite of sprites) {
  batch.addSprite(sprite);
}
batch.flush();
batch.end();
```

### AnimationClip 动画剪辑

```typescript
import { AnimationClip, createAtlasAnimationClip } from 'gamex-engine';

// 从图集创建
const clip = createAtlasAnimationClip(
  'walk', texture, 64, 64, 8, 12, 'loop'
);

// 手动创建
const clip = new AnimationClip({
  name: 'idle',
  frames: [frame1, frame2, frame3],
  fps: 12,
  mode: 'loop',
});
```

### Animator 动画控制器

```typescript
import { Animator } from 'gamex-engine';

const animator = new Animator();
animator.addClip(walkClip);
animator.addClip(idleClip);
animator.play('walk');
animator.pause();
animator.stop();
```

---

## 3. UI 系统

### UIWidget 基类

```typescript
import { UIWidget } from 'gamex-engine';

const widget = new MyWidget();
widget.interactive = true;
widget.disabled = false;
widget.backgroundColor = '#ff0000';
widget.borderRadius = 8;
widget.paddingLeft = 10;
widget.stopPropagation = true;
```

### Button 按钮

```typescript
import { Button } from 'gamex-engine';

const btn = new Button('Click Me', 120, 40);
btn.onClickCallback = () => console.log('clicked');
btn.setStyle({
  normalColor: '#4ecdc4',
  pressedColor: '#45b7aa',
  textColor: '#ffffff',
});
```

### Label 标签

```typescript
import { Label } from 'gamex-engine';

const label = new Label('Hello World', 200, 30);
label.font = '16px sans-serif';
label.color = '#ffffff';
label.textAlign = 'center';
label.wordWrap = true;
label.maxLines = 3;
```

### ScrollView 滚动容器

```typescript
import { ScrollView } from 'gamex-engine';

const scroll = new ScrollView(300, 400);
scroll.contentHeight = 1000;
scroll.direction = 'vertical'; // 'horizontal' | 'both'
scroll.elastic = true;
scroll.onScroll = (e) => {
  console.log(e.scrollRatioY);
};
scroll.scrollToBottom(0.5);
```

### ListView 虚拟列表

```typescript
import { ListView } from 'gamex-engine';

const list = new ListView(300, 400, 50);
list.setData(largeArray);
list.renderItem = (item, index) => {
  const label = new Label(item.name);
  return label;
};
list.refresh();
```

### FlexLayout Flex 布局

```typescript
import { FlexLayout } from 'gamex-engine';

const flex = new FlexLayout({
  direction: 'row',
  wrap: 'wrap',
  justify: 'space-between',
  align: 'center',
  gap: 10,
  padding: { top: 10, right: 10, bottom: 10, left: 10 },
});

flex.addChild(btn1, { grow: 1, shrink: 0 });
flex.addChild(btn2, { grow: 2, basis: 100 });
flex.addChild(btn3, { order: -1 });
flex.applyLayout(containerWidth, containerHeight);
```

### ConstraintSolver 约束布局

```typescript
import { ConstraintSolver, constraintFill, constraintCenter } from 'gamex-engine';

const solver = new ConstraintSolver();

// 填充父容器
solver.setConstraints(child, constraintFill(10));

// 居中
solver.setConstraints(child, constraintCenter());

// 自定义约束
solver.setConstraints(child, {
  left: 10,
  right: 10,
  top: 10,
  bottom: 10,
  aspectRatio: 16 / 9,
  minWidth: 100,
  maxWidth: 500,
});

solver.solve(parentWidth, parentHeight);
```

### LayoutContainer 统一布局容器

```typescript
import { LayoutContainer, createVerticalLayout, createScrollList } from 'gamex-engine';

// 快速创建
const vLayout = createVerticalLayout(10, 20);
vLayout.addWidget(new Button('OK'));
vLayout.addWidget(new Label('Hello'));

// 自定义
const container = new LayoutContainer(400, 300);
container.setFlexLayout({ direction: 'column', gap: 10 });
container.autoLayout = true; // 自动脏标记布局
```

### UIManager UI 管理器

```typescript
import { UIManager } from 'gamex-engine';

const uiManager = new UIManager(input);
uiManager.addWidget(button);
uiManager.removeWidget(button);

// 事件冒泡
uiManager.on('touchstart', (event) => {
  console.log('触摸开始:', event.target);
  event.stopPropagation(); // 阻止冒泡
});
```

---

## 4. 音频系统

### AudioManager 音频管理器

```typescript
import { AudioManager } from 'gamex-engine';

const audioMgr = new AudioManager(platform);

// 创建分类音频
const bgm = audioMgr.createAudio('music');
bgm.load('bgm.mp3');
bgm.play(true);

const sfx = audioMgr.createAudio('sfx');
sfx.load('hit.mp3');
sfx.play();

// 分类控制
audioMgr.setCategoryVolume('music', 0.5);
audioMgr.muteCategory('sfx');
audioMgr.toggleMute('voice');
```

### AudioMixer 音频混音器

```typescript
import { AudioMixer } from 'gamex-engine';

const mixer = new AudioMixer();
mixer.createBus('master');
mixer.createBus('music', 'master');
mixer.createBus('sfx', 'master');

mixer.setBusVolume('music', 0.8);
mixer.muteBus('sfx');
mixer.registerInstance('bgm1', audio, 'music');
```

### SpatialAudioSource 3D 空间音效

```typescript
import { SpatialAudioSource, SpatialAudioListener } from 'gamex-engine';

const source = new SpatialAudioSource(audio, {
  maxDistance: 500,
  referenceDistance: 50,
  rolloff: 'inverse',
  dopplerFactor: 1,
});
source.position.set(100, 200, 0);
source.play(true);

const listener = new SpatialAudioListener();
listener.setPosition(0, 0, 0);
listener.addSource(source);
listener.update(dt);
```

### AudioEffectChain 音频特效

```typescript
import { AudioEffectChain, createUnderwaterPreset } from 'gamex-engine';

// 预设效果
const underwater = createUnderwaterPreset();
underwater.applyTo(audioElement);

// 自定义效果链
const chain = new AudioEffectChain();
chain.addEffect({ type: 'lowpass', frequency: 2000 });
chain.addEffect({ type: 'echo', delayTime: 0.3, decay: 0.5 });
chain.addEffect({ type: 'compressor', threshold: -20, ratio: 4 });
chain.applyTo(audioElement);
```

### AudioSprite 音频精灵

```typescript
import { AudioSprite } from 'gamex-engine';

const sprite = new AudioSprite(audioElement, {
  explosion: { start: 0, end: 1.5 },
  hit: { start: 2, end: 2.5 },
  jump: { start: 3, end: 3.3 },
});

sprite.play('explosion');
sprite.play('hit');
sprite.stop();
```

---

## 5. 物理系统

### RigidBody 刚体

```typescript
import { RigidBody } from 'gamex-engine';

const body = new RigidBody({
  type: 'dynamic',  // 'static' | 'dynamic' | 'kinematic'
  shape: { type: 'rect', width: 50, height: 50 },
  x: 100,
  y: 200,
  mass: 1,
  restitution: 0.3,
  friction: 0.5,
});

body.applyForce(100, -200);
body.applyImpulse(50, 0);
body.setMass(2);
```

### PhysicsWorld 物理世界

```typescript
import { PhysicsWorld } from 'gamex-engine';

const world = new PhysicsWorld({
  gravity: { x: 0, y: 980 },
  iterations: 10,
});

world.addBody(dynamicBody);
world.addBody(staticBody);

// 每帧更新
world.step(dt);

// 获取碰撞
const contacts = world.getContacts();

// 射线投射
const hit = world.raycast(origin, direction, 1000);
```

---

## 6. 动画系统

### SkeletalClip 骨骼动画剪辑

```typescript
import { SkeletalClip, Skeleton, SkeletalAnimator } from 'gamex-engine';

// 创建骨骼
const skeleton = new Skeleton();
skeleton.addBone({ name: 'root', length: 0, x: 0, y: 0, rotation: 0 });
skeleton.addBone({ name: 'body', parent: 'root', length: 50, x: 0, y: -50, rotation: 0 });

// 创建动画
const walkClip = new SkeletalClip({
  name: 'walk',
  duration: 1,
  loop: true,
  tracks: [
    {
      boneName: 'body',
      keyframes: [
        { time: 0, rotation: 0 },
        { time: 0.5, rotation: 0.2 },
        { time: 1, rotation: 0 },
      ],
    },
  ],
});

// 播放
const animator = new SkeletalAnimator(skeleton);
animator.addClip(walkClip);
animator.play('walk');
animator.update(dt);
const transforms = animator.getTransforms();
```

---

## 7. 特效系统

### Tween 补间动画

```typescript
import { Tween, TweenManager, Easing } from 'gamex-engine';

const tweenManager = new TweenManager();

const tween = tweenManager.create(sprite);
tween
  .to({ x: 100, alpha: 0.5 }, 1, Easing.easeOutCubic)
  .to({ y: 200 }, 0.5, Easing.linear)
  .on('complete', () => console.log('done'))
  .start();

// 每帧更新
tweenManager.update(dt);
```

### ParticleEmitter 粒子发射器

```typescript
import { ParticleEmitter, createFireEmitter } from 'gamex-engine';

// 预设效果
const fire = createFireEmitter(0, 0);
fire.play();
scene.addChild(fire);

// 自定义
const emitter = new ParticleEmitter({
  maxParticles: 200,
  emissionRate: 50,
  shape: 'circle',
  shapeRadius: 10,
  lifetimeRange: { min: 0.5, max: 1.5 },
  startSizeRange: { min: 4, max: 8 },
  endSize: 0,
  startColor: new Vec3(1, 0.5, 0),
  endColor: new Vec3(1, 0, 0),
  gravity: new Vec3(0, 200, 0),
});
```

### EnhancedParticleEmitter 增强粒子

```typescript
import { EnhancedParticleEmitter, ForceField } from 'gamex-engine';

const emitter = new EnhancedParticleEmitter({
  maxParticles: 500,
  emissionRate: 100,
  shape: 'sphere',
  shapeRadius: 20,
  lifetimeRange: { min: 1, max: 3 },
  startColor: new Vec3(0.3, 0.5, 1),
  endColor: new Vec3(0.8, 0.3, 1),
  turbulence: 30,
});

// 添加力场
const wind = new ForceField({
  type: 'directional',
  direction: new Vec3(1, 0, 0),
  strength: 100,
});
emitter.addForceField(wind);
```

---

## 8. AI 系统

### BehaviorTree 行为树

```typescript
import {
  BehaviorTree, Blackboard, Sequence, Selector,
  Condition, Action, NodeStatus
} from 'gamex-engine';

const tree = new BehaviorTree(
  new Selector('Root', [
    new Sequence('Attack', [
      new Condition('EnemyInRange', (bb) => bb.get<number>('enemyDistance') < 100),
      new Action('Shoot', (bb) => {
        // 执行射击
        return NodeStatus.SUCCESS;
      }),
    ]),
    new Sequence('Patrol', [
      new Action('MoveToWaypoint', (bb) => {
        // 移动到路径点
        return NodeStatus.RUNNING;
      }),
    ]),
  ])
);

// 每帧更新
tree.blackboard.set('enemyDistance', 50);
tree.tick();
```

### FSM 有限状态机

```typescript
import { FSM, FSMState } from 'gamex-engine';

class IdleState extends FSMState {
  constructor() { super('idle'); }
  onEnter() { console.log('进入空闲'); }
  onUpdate(dt) { /* 检测敌人 */ }
  onExit() { console.log('退出空闲'); }
}

class ChaseState extends FSMState {
  constructor() { super('chase'); }
  onEnter() { console.log('开始追击'); }
  onUpdate(dt) { /* 追击逻辑 */ }
  onExit() { console.log('停止追击'); }
}

const fsm = new FSM();
fsm.addState(new IdleState());
fsm.addState(new ChaseState());
fsm.addTransition('idle', 'chase', () => enemyDetected);
fsm.addTransition('chase', 'idle', () => enemyLost);
fsm.setInitialState('idle');

// 每帧更新
fsm.update(dt);
```

### GridPathfinder A* 寻路

```typescript
import { GridPathfinder } from 'gamex-engine';

const pathfinder = new GridPathfinder(20, 15, {
  allowDiagonal: true,
  diagonalCost: 1.414,
});

// 设置地图
pathfinder.setWalkable(5, 3, false); // 障碍物

// 寻路
const result = pathfinder.findPath(0, 0, 19, 14);
if (result.found) {
  const smoothedPath = GridPathfinder.smoothPath(result.path);
  // 移动到路径点
}
```

### Steering 转向行为

```typescript
import { Seek, Separation, Alignment, Cohesion, SteeringComposite } from 'gamex-engine';

const composite = new SteeringComposite();
composite.addBehavior(new Seek());
composite.addBehavior(new Separation());
composite.addBehavior(new Alignment());
composite.addBehavior(new Cohesion());

const steering = composite.calculate({
  position: entity.position,
  orientation: entity.rotation,
  velocity: entity.velocity,
  targetPosition: target.position,
  neighbors: nearbyEntities,
});

entity.position = entity.position.add(steering.linear.scale(dt));
```

---

## 9. 网络系统

### WebSocketClient WebSocket 客户端

```typescript
import { WebSocketClient } from 'gamex-engine';

const ws = new WebSocketClient({
  url: 'wss://example.com/ws',
  autoReconnect: true,
  maxReconnectAttempts: 10,
  heartbeatInterval: 30000,
});

ws.on('open', () => console.log('已连接'));
ws.on('message', (msg) => console.log('收到:', msg));
ws.on('close', () => console.log('已断开'));

await ws.connect();
ws.send({ type: 'chat', content: 'Hello' });
ws.close();
```

### HttpClient HTTP 客户端

```typescript
import { HttpClient } from 'gamex-engine';

const http = new HttpClient({
  timeout: 10000,
  retries: 3,
  retryDelay: 1000,
});

// 添加拦截器
http.addRequestInterceptor((config) => {
  config.headers = { ...config.headers, 'Authorization': 'token' };
  return config;
});

const response = await http.get('/api/users');
const data = await http.post('/api/users', { name: 'test' });
```

### StateSyncManager 状态同步

```typescript
import { StateSyncManager } from 'gamex-engine';

const sync = new StateSyncManager(ws, { tickRate: 20 });
sync.setPlayerId('player1');
sync.registerObject('player1', playerSprite);

// 发送输入
sync.sendInput({ moveX: 1, moveY: 0 });

// 获取插值状态
const state = sync.getInterpolationState();
```

### LagCompensator 延迟补偿

```typescript
import { LagCompensator, InterpolationBuffer } from 'gamex-engine';

const compensator = new LagCompensator();
compensator.recordInput(input);
compensator.handleAck(tick, serverTime);
compensator.updateRTT(rttSample);

const buffer = new InterpolationBuffer(60, 100);
buffer.add(timestamp, state);
const interpolated = buffer.get(currentTime);
```

---

## 10. 游戏框架

### GameStateManager 游戏状态机

```typescript
import { GameStateManager, PlayingState, MenuState, GameOverState } from 'gamex-engine';

const gsm = new GameStateManager();
gsm.registerState(new MenuState((action) => {
  if (action === 'start') gsm.transitionTo('playing');
}));
gsm.registerState(new PlayingState(
  (dt) => { /* 游戏逻辑 */ },
  () => { /* 渲染 */ }
));
gsm.registerState(new GameOverState(
  () => gsm.transitionTo('playing'),
  () => gsm.transitionTo('menu')
));

gsm.setInitialState('menu');
gsm.update(dt);
gsm.render();
```

### SaveManager 存档系统

```typescript
import { SaveManager } from 'gamex-engine';

const saveMgr = new SaveManager(platform, {
  prefix: 'mygame_',
  maxSlots: 5,
  autoSave: true,
  autoSaveInterval: 300,
});

// 保存
saveMgr.save(0, {
  version: 1,
  timestamp: Date.now(),
  gameState: { level: 5, score: 1000 },
  playerData: { hp: 100, position: { x: 100, y: 200 } },
  levelData: {},
  stats: {},
});

// 加载
const data = saveMgr.load(0);

// 自动保存
saveMgr.updateAutoSave(dt, () => getCurrentGameState());
```

### ScoreManager 分数系统

```typescript
import { ScoreManager } from 'gamex-engine';

const score = new ScoreManager(platform);
score.addScore(100, 'enemy_kill');
score.setMultiplier(2);
score.setComboTimeout(2);

score.on('scoreChanged', (total) => console.log('分数:', total));
score.on('comboChanged', (combo) => console.log('连击:', combo));

score.update(dt);
console.log(score.getScore());
console.log(score.getHighScore());
```

### AchievementManager 成就系统

```typescript
import { AchievementManager } from 'gamex-engine';

const achievements = new AchievementManager(platform);
achievements.register({
  id: 'first_kill',
  name: '首杀',
  description: '击杀第一个敌人',
  condition: (stats) => stats.kills >= 1,
});
achievements.register({
  id: 'speed_demon',
  name: '速度恶魔',
  description: '在60秒内通关',
  hidden: true,
  condition: (stats) => stats.playTime <= 60 && stats.levelsCompleted >= 1,
});

// 检查解锁
const unlocked = achievements.check(gameStats);
achievements.on('achievementUnlocked', (a) => console.log('解锁:', a.name));
```

### InputMapper 输入映射

```typescript
import { InputMapper, createMovementBindings, createGameBindings } from 'gamex-engine';

const mapper = new InputMapper();
createMovementBindings(mapper);
createGameBindings(mapper);

// 自定义绑定
mapper.bindKey('attack', 'KeyJ');
mapper.bindKey('special', 'KeyK');
mapper.bindAxis('look', 'KeyI', 'KeyK');

// 每帧更新
mapper.update(dt);

// 查询状态
if (mapper.isActionJustPressed('attack')) {
  // 攻击
}
const move = mapper.getAxis2D('horizontal', 'vertical');
```

---

## 11. 3D 渲染

### Material 材质

```typescript
import { Material, createPBRMaterial } from 'gamex-engine';

const material = createPBRMaterial(
  new Vec3(1, 0.5, 0.3), // 基础颜色
  0.8,                     // 金属度
  0.4                      // 粗糙度
);

material.setTexture('albedo', 0);
material.setUniform('emissiveStrength', 2);
```

### Light 光源

```typescript
import { DirectionalLight, PointLight, SpotLight, LightManager } from 'gamex-engine';

const lightMgr = new LightManager();

// 方向光（太阳）
const sun = new DirectionalLight({
  direction: new Vec3(0, -1, -1),
  color: new Vec3(1, 0.95, 0.9),
  intensity: 1.2,
  castShadow: true,
});
lightMgr.addLight(sun);

// 点光源
const lamp = new PointLight({
  position: new Vec3(100, 200, 0),
  radius: 150,
  decay: 2,
});
lightMgr.addLight(lamp);

// 计算光照
const litColor = lightMgr.calculateLighting(position, normal);
```

### Mesh 网格

```typescript
import { Mesh, createSphereMesh, createCubeMesh } from 'gamex-engine';

const sphere = createSphereMesh(0.5, 32, 24);
const cube = createCubeMesh(1);
const plane = createPlaneMesh(10, 10, 5, 5);
const cylinder = createCylinderMesh(0.5, 2, 16);
```

### PostProcess 后处理

```typescript
import { PostProcessPipeline } from 'gamex-engine';

const pipeline = new PostProcessPipeline();
pipeline.addEffect({ type: 'bloom', bloomThreshold: 0.8, bloomIntensity: 0.5 });
pipeline.addEffect({ type: 'fxaa' });
pipeline.addEffect({ type: 'colorGrading', saturation: 1.2, contrast: 1.1 });
pipeline.addEffect({ type: 'vignette', vignetteIntensity: 0.4 });
```

### WebGLRenderer WebGL 渲染器

```typescript
import { WebGLRenderer } from 'gamex-engine';

const glRenderer = new WebGLRenderer(canvas);
glRenderer.clear(0.1, 0.1, 0.15, 1);
glRenderer.useDefaultShader();
glRenderer.setMatrix('u_projection', projectionMatrix.data);
```

### Camera 相机

```typescript
import { Camera } from 'gamex-engine';

// 2D 相机
const camera2d = new Camera({
  type: '2d',
  viewportWidth: 800,
  viewportHeight: 600,
});
camera2d.zoom = 2;
camera2d.setFollowTarget(player, 0.1, 0, -100);
camera2d.shake(10, 0.5);

// 3D 相机
const camera3d = new Camera({
  type: '3d',
  viewportWidth: 800,
  viewportHeight: 600,
  fov: Math.PI / 4,
  near: 0.1,
  far: 1000,
});
camera3d.position.set(0, 5, 10);
camera3d.target.set(0, 0, 0);
```

---

## 12. 数学库

### Vec2 二维向量

```typescript
import { Vec2 } from 'gamex-engine';

const a = new Vec2(1, 2);
const b = new Vec2(3, 4);

a.add(b);           // (4, 6)
a.subtract(b);      // (-2, -2)
a.scale(2);         // (2, 4)
a.normalize();      // 归一化
a.dot(b);           // 点积
a.length();         // 长度
a.distance(b);      // 距离
a.lerp(b, 0.5);     // 线性插值
```

### Vec3 三维向量

```typescript
import { Vec3 } from 'gamex-engine';

const v = new Vec3(1, 2, 3);
v.add(new Vec3(4, 5, 6));
v.cross(new Vec3(0, 1, 0));
v.normalize();
```

### Mat4 4x4 矩阵

```typescript
import { Mat4, Vec3 } from 'gamex-engine';

const proj = Mat4.perspective(Math.PI / 4, 800 / 600, 0.1, 1000);
const view = Mat4.lookAt(
  new Vec3(0, 5, 10),
  new Vec3(0, 0, 0),
  new Vec3(0, 1, 0)
);
const model = new Mat4().translate(0, 0, -5).rotateY(0.5);

const mvp = proj.multiply(view).multiply(model);
```

### Quat 四元数

```typescript
import { Quat, Vec3 } from 'gamex-engine';

const q = Quat.fromAxisAngle(new Vec3(0, 1, 0), Math.PI / 4);
const rotation = Quat.fromEuler(pitch, yaw, roll);
const blended = q1.slerp(q2, 0.5);
const rotatedVec = q.rotateVector(new Vec3(1, 0, 0));
```

---

## 13. 工具类

### Logger 日志系统

```typescript
import { Logger, LogLevel } from 'gamex-engine';

Logger.configure({
  level: LogLevel.DEBUG,
  development: true,
  console: { enabled: true },
});

const log = Logger.forModule('Game');
log.debug('帧数: %d', fps);
log.info('玩家加入: %s', playerName);
log.warning('资源加载失败: %s', url);
log.error('致命错误: %o', error);
```

### TimerManager 定时器

```typescript
import { TimerManager } from 'gamex-engine';

const timers = new TimerManager();
timers.delay(2, () => console.log('2秒后'));
timers.interval(1, () => console.log('每秒'));
timers.pause();
timers.resume();
timers.cancel(id);
```

### LRUCache LRU 缓存

```typescript
import { LRUCache } from 'gamex-engine';

const cache = new LRUCache<string, Texture>(100);
cache.set('hero', texture);
cache.get('hero');
cache.delete('hero');
cache.getUsageRate();
```

### Storage 存储

```typescript
import { Storage } from 'gamex-engine';

Storage.set('key', 'value');
Storage.get('key');
Storage.remove('key');
Storage.clear();
```

### ErrorHandler 错误处理

```typescript
import { ErrorHandlerManager } from 'gamex-engine';

ErrorHandlerManager.init();
ErrorHandlerManager.onError((info) => {
  console.error('错误:', info.message);
});
```

### MathUtils 数学工具

```typescript
import { MathUtils } from 'gamex-engine';

MathUtils.clamp(15, 0, 10);     // 10
MathUtils.lerp(0, 100, 0.5);    // 50
MathUtils.randomRange(1, 10);    // 随机数
MathUtils.degToRad(180);         // Math.PI
MathUtils.smoothDamp(current, target, velocity, dt);
```

### ResolutionScaler 分辨率适配

```typescript
import { ResolutionScaler } from 'gamex-engine';

const scaler = new ResolutionScaler(750, 1334, 'fixed-height');
const result = scaler.calculate(platform.getScreenInfo());
ctx.translate(result.offsetX, result.offsetY);
ctx.scale(result.scale, result.scale);

// 坐标转换
const designPos = scaler.screenToDesign(screenX, screenY, screenInfo);
```

---

## 14. 平台适配

### IPlatform 平台接口

```typescript
import { IPlatform } from 'gamex-engine';

// 微信
import { WxPlatform } from 'gamex-engine';
const platform = new WxPlatform();

// 抖音
import { TtPlatform } from 'gamex-engine';
const platform = new TtPlatform();

// H5
import { H5Platform } from 'gamex-engine';
const platform = new H5Platform();

const engine = new Engine(platform);
```

### SafeAreaAdapter 安全区适配

```typescript
import { SafeAreaAdapter } from 'gamex-engine';

const adapter = new SafeAreaAdapter({ debug: true });
const safeArea = adapter.getSafeArea();
console.log(safeArea.top, safeArea.bottom);
```

---

## 导入方式

```typescript
// 完整导入
import { Engine, Scene, Node, ... } from 'gamex-engine';

// 按需导入
import { Engine } from 'gamex-engine';
import { Sprite } from 'gamex-engine';
```

---

## 15. 移动端事件

### MobileEventManager 移动端事件管理器

```typescript
import { MobileEventManager } from 'gamex-engine';

const mobile = new MobileEventManager(platform);

// 应用生命周期
mobile.onAppShow(() => console.log('应用回到前台'));
mobile.onAppHide(() => console.log('应用进入后台'));

// 网络状态
mobile.onNetworkChange((status) => {
  console.log(status.isConnected, status.type);
});

// 屏幕方向
mobile.onOrientationChange((orientation) => {
  console.log(orientation); // 'portrait' | 'landscape-left' | ...
});

// 电池状态
mobile.onBatteryChange((status) => {
  console.log(status.level, status.isCharging);
});

// 手势
mobile.onTap((x, y) => console.log('点击:', x, y));
mobile.onLongPress((x, y) => console.log('长按:', x, y));
mobile.onSwipe((direction, distance) => console.log('滑动:', direction));
mobile.onPinch((scale) => console.log('缩放:', scale));

// 摇一摇
mobile.onShake((e) => console.log('摇一摇'));

// 振动
mobile.vibrateShort();
mobile.vibrateLong();
mobile.vibrate([100, 50, 100]); // 自定义振动模式

// 剪贴板
await mobile.copyToClipboard('text');
const text = await mobile.readFromClipboard();

// 屏幕常亮
mobile.setKeepScreenOn(true);

// 全屏
mobile.requestFullscreen();
mobile.exitFullscreen();
```

### AdManager 广告管理器

```typescript
import { AdManager, createRewardedAdConfig } from 'gamex-engine';

const ad = new AdManager(platform);

// 注册广告
ad.register(createRewardedAdConfig('reward_001'));
ad.register({
  adUnitId: 'interstitial_001',
  type: 'interstitial',
  showInterval: 60, // 60秒间隔
});

// 加载广告
await ad.load('reward_001');

// 展示激励视频
ad.onRewarded((adUnitId, type, amount) => {
  console.log(`获得奖励: ${type} x${amount}`);
  addCoins(amount);
});
await ad.showRewarded('reward_001');

// 检查是否可展示
if (ad.canShow('interstitial_001')) {
  ad.show('interstitial_001');
}
```

### PaymentManager 支付管理器

```typescript
import { PaymentManager, NewPaymentManager } from 'gamex-engine';

const payment = new NewPaymentManager(platform);

// 加载商品
const products = await payment.loadProducts(['coin_100', 'coin_500']);

// 监听支付成功
payment.onPaymentSuccess((order) => {
  console.log(`购买成功: ${order.productId}`);
  grantProduct(order.productId);
});

// 发起购买
await payment.purchase('coin_100');

// 检查是否已购买
if (payment.hasPurchased('month_card')) {
  activateMonthCard();
}

// 恢复购买（iOS）
const restored = await payment.restorePurchases();
```

### PerformanceMonitor 性能监控

```typescript
import { PerformanceMonitor, Profiler } from 'gamex-engine';

const perf = new PerformanceMonitor();
perf.start();

// 游戏循环
function gameLoop() {
  perf.beginFrame();
  
  perf.beginUpdate();
  // ... 游戏逻辑
  perf.endUpdate();
  
  perf.beginRender();
  // ... 渲染
  perf.endRender();
  
  perf.endFrame();
}

// 监听性能警告
perf.onWarning((warning) => {
  console.warn(warning.message);
});

perf.onLowFps((fps) => {
  console.warn(`FPS 过低: ${fps}`);
});

// 获取指标
const metrics = perf.getMetrics();
console.log(`FPS: ${metrics.fps}, 内存: ${metrics.memoryUsed}MB`);

// 性能分析器
const profiler = new Profiler();
profiler.start('update');
// ... 代码
profiler.end('update');
console.log('平均耗时:', profiler.getAverage('update'), 'ms');
```

### ErrorTracker 错误追踪

```typescript
import { ErrorTracker } from 'gamex-engine';

const tracker = new ErrorTracker(platform, {
  enabled: true,
  autoReport: true,
  reportUrl: 'https://api.example.com/errors',
  captureResourceErrors: true,
  capturePromiseRejections: true,
});

tracker.start();

// 监听错误
tracker.onError((error) => {
  console.error(`错误: ${error.message} (${error.type})`);
});

// 添加面包屑
tracker.addBreadcrumb('玩家点击了开始按钮');
tracker.addBreadcrumb('进入关卡 5', 'game');

// 自定义错误
tracker.captureError(new Error('自定义错误'), 'game_logic');

// 手动上报
tracker.flush();
```

---

## 构建命令

```bash
npm run build          # 构建三平台
npm run build:lib      # 构建库（CJS/ESM/d.ts）
npm run typecheck      # TypeScript 类型检查
npm run test           # 运行测试
npm run lint           # ESLint 检查
npm run validate       # 完整验证
```
