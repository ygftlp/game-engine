# UI组件系统文档

## 概述

轻量级2D游戏引擎提供完整的UI组件系统，支持跨平台（微信小游戏、抖音小游戏、H5）运行。所有UI组件都继承自`UIWidget`基类，具有一致的交互体验和视觉表现。

## 组件清单

### 1. 基础组件

| 组件 | 说明 | 核心功能 |
|------|------|----------|
| **UIWidget** | UI组件基类 | 布局、交互、状态管理、背景绘制 |
| **Button** | 按钮 | 点击事件、多状态样式、文本/图标 |
| **Label** | 文本标签 | 多行文本、对齐、自动换行 |
| **ProgressBar** | 进度条 | 水平/垂直、动画过渡、百分比显示 |

### 2. 容器组件

| 组件 | 说明 | 核心功能 |
|------|------|----------|
| **Panel** | 面板容器 | 垂直/水平/网格布局、内容裁剪 |

### 3. 交互组件

| 组件 | 说明 | 核心功能 |
|------|------|----------|
| **Toggle** | 开关 | 切换状态、动画过渡、回调 |
| **Slider** | 滑块 | 水平/垂直、步长、值显示 |
| **Dialog** | 对话框 | 标题、内容、按钮、模态显示 |
| **Toast** | 提示框 | 自动消失、淡入淡出动画 |

### 4. 游戏专用组件

| 组件 | 说明 | 核心功能 |
|------|------|----------|
| **Joystick** | 虚拟摇杆 | 方向控制、力度检测、固定/浮动模式 |
| **HealthBar** | 生命条 | 生命值显示、低血量警告、数字显示 |

### 5. 管理器

| 组件 | 说明 | 核心功能 |
|------|------|----------|
| **UIManager** | UI管理器 | 组件生命周期、交互分发、层级管理 |

---

## 组件详细定义

### UIWidget（基类）

所有UI组件的父类，提供基础能力。

**属性：**
```typescript
interactive: boolean      // 是否可交互
disabled: boolean         // 是否禁用
backgroundColor: string   // 背景色
borderColor: string       // 边框色
borderWidth: number       // 边框宽度
borderRadius: number      // 圆角半径
paddingLeft/Right/Top/Bottom: number  // 内边距
```

**方法：**
```typescript
setPadding(padding: number): void  // 设置统一内边距
onTouchStart(point: TouchPoint): void
onTouchMove(point: TouchPoint): void
onTouchEnd(point: TouchPoint): void
```

---

### Button（按钮）

**属性：**
```typescript
text: string              // 按钮文本
onClickCallback: () => void  // 点击回调
```

**样式配置：**
```typescript
setStyle({
  normalColor: '#4ecdc4',    // 正常状态颜色
  pressedColor: '#45b7aa',   // 按下状态颜色
  disabledColor: '#95a5a6',  // 禁用状态颜色
  textColor: '#ffffff',      // 文本颜色
  font: 'bold 16px sans-serif',
  borderRadius: 6
})
```

**使用示例：**
```typescript
const btn = new Button('点击我', 120, 40);
btn.onClickCallback = () => console.log('clicked');
uiManager.addWidget(btn);
```

---

### Label（文本标签）

**属性：**
```typescript
text: string              // 文本内容
font: string              // 字体
color: string             // 文本颜色
textAlign: 'left' | 'center' | 'right'  // 水平对齐
verticalAlign: 'top' | 'middle' | 'bottom'  // 垂直对齐
wordWrap: boolean         // 是否自动换行
lineHeight: number        // 行高
maxLines: number          // 最大行数
```

**使用示例：**
```typescript
const label = new Label('Hello World', 200, 30);
label.font = 'bold 24px sans-serif';
label.textAlign = 'center';
label.color = '#ffffff';
```

---

### ProgressBar（进度条）

**属性：**
```typescript
value: number             // 当前值
minValue: number          // 最小值
maxValue: number          // 最大值
trackColor: string        // 轨道颜色
fillColor: string         // 填充颜色
direction: 'horizontal' | 'vertical'
showPercent: boolean      // 是否显示百分比
animationSpeed: number    // 动画速度（秒）
```

**方法：**
```typescript
setValueAnimated(val: number, duration?: number): void
```

**使用示例：**
```typescript
const bar = new ProgressBar(200, 20);
bar.value = 0.75;
bar.fillColor = '#4ecdc4';
bar.showPercent = true;
```

---

### Panel（面板）

**属性：**
```typescript
layout: 'none' | 'vertical' | 'horizontal' | 'grid'
spacing: number           // 子组件间距
clipContent: boolean      // 是否裁剪内容
```

**方法：**
```typescript
addWidget(widget: UIWidget): void
removeWidget(widget: UIWidget): void
updateLayout(): void
```

**使用示例：**
```typescript
const panel = new Panel(300, 400);
panel.layout = 'vertical';
panel.spacing = 10;
panel.addWidget(new Button('Button 1'));
panel.addWidget(new Button('Button 2'));
```

---

### Toggle（开关）

**属性：**
```typescript
checked: boolean          // 是否选中
onColor: string           // 开启颜色
offColor: string          // 关闭颜色
thumbColor: string        // 滑块颜色
onChangeCallback: (checked: boolean) => void
```

**方法：**
```typescript
toggle(): void
```

**使用示例：**
```typescript
const toggle = new Toggle(50, 28);
toggle.checked = true;
toggle.onChangeCallback = (val) => console.log('Toggle:', val);
```

---

### Slider（滑块）

**属性：**
```typescript
value: number             // 当前值
minValue: number          // 最小值
maxValue: number          // 最大值
step: number              // 步长
trackColor: string        // 轨道颜色
fillColor: string         // 填充颜色
thumbColor: string        // 滑块颜色
thumbRadius: number       // 滑块半径
direction: 'horizontal' | 'vertical'
showValue: boolean        // 是否显示值
onChangeCallback: (value: number) => void
```

**使用示例：**
```typescript
const slider = new Slider(200, 20);
slider.minValue = 0;
slider.maxValue = 100;
slider.value = 50;
slider.showValue = true;
```

---

### Dialog（对话框）

**属性：**
```typescript
title: string             // 标题
content: string           // 内容
modal: boolean            // 是否模态
maskColor: string         // 遮罩颜色
```

**方法：**
```typescript
setTitle(title: string): void
setContent(content: string): void
addButton(text: string, callback?: () => void, color?: string): void
show(): void
close(): void
```

**使用示例：**
```typescript
const dialog = new Dialog(300, 200);
dialog.setTitle('提示');
dialog.setContent('确定要退出吗？');
dialog.addButton('取消');
dialog.addButton('确定', () => console.log('confirmed'));
dialog.show();
```

---

### Toast（提示框）

**属性：**
```typescript
message: string           // 消息文本
duration: number          // 显示时长（秒）
position: 'top' | 'center' | 'bottom'
```

**使用示例：**
```typescript
// 方式1：静态方法
Toast.show('操作成功', 2);

// 方式2：实例
const toast = new Toast();
toast.show('加载中...');
```

---

### Joystick（虚拟摇杆）

**属性：**
```typescript
direction: Vec2           // 方向（归一化）
force: number             // 力度（0-1）
outerRadius: number       // 外圈半径
innerRadius: number       // 内圈半径
outerColor: string        // 外圈颜色
innerColor: string        // 内圈颜色
fixed: boolean            // 是否固定位置
onChangeCallback: (direction: Vec2, force: number) => void
```

**使用示例：**
```typescript
const joystick = new Joystick();
joystick.x = 100;
joystick.y = 400;
joystick.onChangeCallback = (dir, force) => {
  player.x += dir.x * force * speed;
  player.y += dir.y * force * speed;
};
```

---

### HealthBar（生命条）

**属性：**
```typescript
health: number            // 当前生命值
maxHealth: number         // 最大生命值
healthColor: string       // 生命条颜色
lowHealthColor: string    // 低血量颜色
lowHealthThreshold: number  // 低血量阈值
showNumber: boolean       // 是否显示数字
showBorder: boolean       // 是否显示边框
```

**方法：**
```typescript
setHealth(current: number, max?: number): void
```

**使用示例：**
```typescript
const healthBar = new HealthBar(100, 12);
healthBar.setHealth(100, 100);
healthBar.showNumber = true;
```

---

### UIManager（UI管理器）

**方法：**
```typescript
addWidget(widget: UIWidget): void
removeWidget(widget: UIWidget): void
clearAll(): void
findWidgetByName(name: string): UIWidget | null
update(dt: number): void
render(renderer: Renderer): void
```

**使用示例：**
```typescript
const uiManager = new UIManager(engine.input);

// 添加UI组件
uiManager.addWidget(button);
uiManager.addWidget(label);

// 在场景中更新和渲染
update(dt: number) {
  uiManager.update(dt);
}

draw(renderer: Renderer) {
  uiManager.render(renderer);
}
```

---

## 跨端适配说明

### 微信小游戏
- 触摸事件通过`wx.onTouchStart/Move/End`获取
- Canvas使用`wx.createCanvas()`创建
- 字体使用系统默认字体

### 抖音小游戏
- 触摸事件通过`tt.onTouchStart/Move/End`获取
- Canvas使用`tt.createCanvas()`创建
- 字体使用系统默认字体

### H5网页
- 触摸事件和鼠标事件统一转换为指针事件
- Canvas使用`document.createElement('canvas')`创建
- 字体使用CSS字体

---

## 性能优化建议

1. **减少绘制调用**：合并相同样式的UI组件绘制
2. **对象池**：频繁创建/销毁的UI使用对象池
3. **脏标记**：只在属性变化时重新计算布局
4. **裁剪**：使用`clipContent`裁剪超出区域的内容
5. **批量渲染**：相同材质的UI组件批量绘制

---

## 体积控制

UI系统总计约**15KB**（gzip后约**5KB**），包含：
- 基础组件：3KB
- 交互组件：4KB
- 游戏组件：3KB
- 管理器：2KB
- 类型定义：3KB

符合轻量级引擎的体积要求。