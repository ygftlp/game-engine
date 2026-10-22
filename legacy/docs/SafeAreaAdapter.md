# 小程序安全区适配器使用指南

## 概述

`SafeAreaAdapter` 是一个专门用于适配微信/抖音小程序顶部安全区的通用模块，支持：

- 自动识别运行环境（微信小程序/抖音小程序）
- 精准获取状态栏、导航栏安全区域尺寸
- 自定义返回按钮和标题栏
- 兼容主流 iOS/Android 设备

---

## 快速开始

### 1. 基本使用

```typescript
import { SafeAreaAdapter } from 'lite-game-engine';

// 创建适配器（自动检测平台）
const adapter = new SafeAreaAdapter();

// 获取安全区域信息
console.log('顶部安全高度:', adapter.getTopHeight());
console.log('底部安全高度:', adapter.getBottomHeight());
console.log('状态栏高度:', adapter.getStatusBarHeight());
console.log('导航栏高度:', adapter.getNavigationBarHeight());
console.log('是否刘海屏:', adapter.hasNotch());
```

### 2. 自定义配置

```typescript
const adapter = new SafeAreaAdapter({
  backButton: {
    show: true,
    text: '返回',
    icon: '←',
    textColor: '#ffffff',
    backgroundColor: 'rgba(0,0,0,0.3)',
    fontSize: 14,
    onClick: () => {
      console.log('返回按钮被点击');
    }
  },
  titleBar: {
    show: true,
    title: '游戏中心',
    subtitle: '选择游戏开始',
    titleColor: '#ffffff',
    titleFontSize: 17,
  },
  debug: true, // 开启调试日志
});
```

### 3. 在游戏场景中使用

```typescript
import { Scene, Renderer, SafeAreaAdapter } from 'lite-game-engine';

class GameScene extends Scene {
  private safeArea: SafeAreaAdapter;

  constructor() {
    super();
    this.safeArea = new SafeAreaAdapter({
      backButton: {
        show: true,
        onClick: () => {
          // 返回上一页
          engine.popScene();
        }
      },
      titleBar: {
        show: true,
        title: 'Flappy Bird',
      }
    });
  }

  protected draw(renderer: Renderer): void {
    const ctx = renderer.ctx;

    // 渲染导航栏（背景 + 返回按钮 + 标题）
    this.safeArea.renderNavigationBar(ctx, {
      backgroundColor: '#1a1a2e',
      backgroundAlpha: 1,
    });

    // 渲染游戏内容（在安全区域下方）
    this.renderGameContent(ctx);
  }

  private renderGameContent(ctx: CanvasRenderingContext2D): void {
    const contentTop = this.safeArea.getContentTop();
    const contentHeight = this.safeArea.getContentHeight();

    // 在内容区域绘制游戏
    ctx.fillStyle = '#4ec0ca';
    ctx.fillRect(0, contentTop, engine.width, contentHeight);
  }
}
```

---

## API 参考

### SafeAreaAdapter

#### 构造函数

```typescript
new SafeAreaAdapter(config?: Partial<SafeAreaAdapterConfig>)
```

#### 方法

| 方法 | 返回值 | 说明 |
|------|--------|------|
| `getPlatform()` | `MiniAppPlatform` | 获取当前平台类型 |
| `getSafeArea()` | `SafeAreaInfo` | 获取完整安全区域信息 |
| `getTopHeight()` | `number` | 获取顶部安全高度 |
| `getBottomHeight()` | `number` | 获取底部安全高度 |
| `getContentHeight()` | `number` | 获取内容区域高度 |
| `getContentTop()` | `number` | 获取内容区域起始Y坐标 |
| `hasNotch()` | `boolean` | 是否为刘海屏 |
| `getStatusBarHeight()` | `number` | 获取状态栏高度 |
| `getNavigationBarHeight()` | `number` | 获取导航栏高度 |
| `transformPoint(x, y)` | `{x, y}` | 将原始坐标转换为内容区域坐标 |
| `renderBackground(ctx, color?, alpha?)` | `void` | 渲染安全区背景 |
| `renderBackButton(ctx, config?)` | `void` | 渲染返回按钮 |
| `renderTitleBar(ctx, config?)` | `void` | 渲染标题栏 |
| `renderNavigationBar(ctx, options?)` | `void` | 渲染完整导航栏 |
| `getBackButtonRect(config?)` | `Rect` | 获取返回按钮点击区域 |
| `isPointInBackButton(x, y, config?)` | `boolean` | 检测点是否在返回按钮内 |
| `updateConfig(config)` | `void` | 更新配置 |
| `refresh()` | `void` | 刷新安全区域信息 |

---

## 配置项

### SafeAreaAdapterConfig

```typescript
interface SafeAreaAdapterConfig {
  backButton?: BackButtonConfig;  // 返回按钮配置
  titleBar?: TitleBarConfig;      // 标题栏配置
  autoAdapt?: boolean;            // 是否自动适配
  debug?: boolean;                // 调试模式
}
```

### BackButtonConfig

```typescript
interface BackButtonConfig {
  show: boolean;              // 是否显示
  text?: string;              // 按钮文本
  icon?: string;              // 按钮图标
  x?: number;                 // X坐标
  y?: number;                 // Y坐标
  width?: number;             // 宽度
  height?: number;            // 高度
  textColor?: string;         // 文本颜色
  backgroundColor?: string;   // 背景色
  backgroundAlpha?: number;   // 背景透明度
  fontSize?: number;          // 字体大小
  onClick?: () => void;       // 点击回调
}
```

### TitleBarConfig

```typescript
interface TitleBarConfig {
  show: boolean;                // 是否显示
  title?: string;               // 标题文本
  subtitle?: string;            // 副标题
  titleColor?: string;          // 标题颜色
  subtitleColor?: string;       // 副标题颜色
  titleFontSize?: number;       // 标题字体大小
  subtitleFontSize?: number;    // 副标题字体大小
  backgroundColor?: string;     // 背景色
  backgroundAlpha?: number;     // 背景透明度
}
```

---

## 完整示例

### 示例1：Flappy Bird 游戏

```typescript
import { Engine, Scene, SafeAreaAdapter } from 'lite-game-engine';

class FlappyBirdScene extends Scene {
  private safeArea: SafeAreaAdapter;

  constructor() {
    super();
    this.safeArea = new SafeAreaAdapter({
      backButton: {
        show: true,
        text: '返回',
        onClick: () => engine.popScene(),
      },
      titleBar: {
        show: true,
        title: 'Flappy Bird',
        subtitle: '点击屏幕开始',
      }
    });
  }

  protected draw(renderer: any): void {
    const ctx = renderer.ctx;
    const w = engine.width;
    const h = engine.height;

    // 背景
    ctx.fillStyle = '#4ec0ca';
    ctx.fillRect(0, 0, w, h);

    // 渲染导航栏
    this.safeArea.renderNavigationBar(ctx, {
      backgroundColor: '#2c3e50',
      backgroundAlpha: 0.8,
    });

    // 游戏内容区域
    const contentTop = this.safeArea.getContentTop();
    const contentHeight = this.safeArea.getContentHeight();

    // 在内容区域绘制游戏元素
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(50, contentTop + 100, 100, 200);

    // 分数
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('100', w / 2, contentTop + 50);
  }
}
```

### 示例2：返回按钮触摸处理

```typescript
class GameScene extends Scene {
  private safeArea: SafeAreaAdapter;

  constructor() {
    super();
    this.safeArea = new SafeAreaAdapter({
      backButton: {
        show: true,
        onClick: () => console.log('返回'),
      }
    });

    // 绑定触摸事件
    engine.input.onStart((touches) => {
      if (touches.length > 0) {
        const t = touches[0];
        // 检测是否点击了返回按钮
        if (this.safeArea.isPointInBackButton(t.x, t.y)) {
          this.safeArea.getSafeArea(); // 触发返回按钮配置的onClick
        }
      }
    });
  }
}
```

---

## 设备兼容性

| 设备 | 状态栏高度 | 导航栏高度 | 刘海屏 |
|------|-----------|-----------|--------|
| iPhone X/11/12/13 | 44px | 44px | ✅ |
| iPhone SE | 20px | 44px | ❌ |
| iPhone 14 Pro | 54px | 44px | ✅ |
| Android 普通 | 24px | 48px | ❌ |
| Android 刘海屏 | 28px | 48px | ✅ |

---

## 常见问题

### Q: 如何在 H5 端使用？

A: H5 端会自动使用 CSS `env(safe-area-inset-*)` 获取安全区域，无需特殊处理。

### Q: 如何动态更新标题？

A: 使用 `updateConfig` 方法：
```typescript
adapter.updateConfig({
  titleBar: { title: '新标题' }
});
```

### Q: 如何隐藏返回按钮？

A: 
```typescript
adapter.updateConfig({
  backButton: { show: false }
});
```

---

## 许可证

MIT