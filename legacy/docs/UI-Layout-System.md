# UI 布局系统文档

> 版本：2.0.0  
> 最后更新：2026-06-17

---

## 概述

GameX Engine 提供完整的 UI 布局系统，支持 Flex 布局、约束布局、滚动容器、虚拟列表等多种布局方式。所有布局系统都支持脏标记自动布局，减少不必要的重算。

---

## 布局类型总览

| 布局类型 | 类 | 适用场景 |
|---------|-----|---------|
| **Flex 布局** | `FlexLayout` | 列表、菜单、工具栏、导航栏 |
| **约束布局** | `ConstraintSolver` | 复杂定位、响应式布局 |
| **滚动容器** | `ScrollView` | 长内容、设置页面、聊天记录 |
| **虚拟列表** | `ListView` | 大量数据列表（性能优化） |
| **统一容器** | `LayoutContainer` | 快速搭建、混合布局 |
| **Panel 内置** | `Panel` | 简单分组、卡片 |

---

## 1. Flex 布局

### 基础用法

```typescript
import { FlexLayout } from 'gamex-engine';

const layout = new FlexLayout({
  direction: 'row',       // 主轴方向
  wrap: 'wrap',           // 换行方式
  justify: 'center',      // 主轴对齐
  align: 'center',        // 交叉轴对齐
  gap: 10,                // 子项间距
  rowGap: 5,              // 行间距（换行时）
  padding: { top: 10, right: 10, bottom: 10, left: 10 },
});

layout.addChild(button1);
layout.addChild(button2);
layout.applyLayout(containerWidth, containerHeight);
```

### 方向（direction）

| 值 | 说明 |
|----|------|
| `row` | 水平排列，从左到右 |
| `row-reverse` | 水平排列，从右到左 |
| `column` | 垂直排列，从上到下 |
| `column-reverse` | 垂直排列，从下到上 |

### 换行（wrap）

| 值 | 说明 |
|----|------|
| `nowrap` | 不换行，子项可能溢出 |
| `wrap` | 按正常方向换行 |
| `wrap-reverse` | 按反方向换行 |

### 主轴对齐（justify）

| 值 | 说明 |
|----|------|
| `flex-start` | 起始对齐 |
| `flex-end` | 结束对齐 |
| `center` | 居中对齐 |
| `space-between` | 两端对齐，间距相等 |
| `space-around` | 每项两侧间距相等 |
| `space-evenly` | 所有间距完全相等 |

### 交叉轴对齐（align）

| 值 | 说明 |
|----|------|
| `flex-start` | 起始对齐 |
| `flex-end` | 结束对齐 |
| `center` | 居中对齐 |
| `stretch` | 拉伸填满 |
| `baseline` | 基线对齐 |

### 子项配置

```typescript
layout.addChild(button, {
  grow: 1,           // 弹性伸展比例（默认 0）
  shrink: 0,         // 弹性收缩比例（默认 1）
  basis: 100,        // 固定基础尺寸
  alignSelf: 'flex-end', // 单独交叉轴对齐
  order: -1,         // 排序（数字小的在前）
  margin: { top: 5, right: 5, bottom: 5, left: 5 },
});
```

### 脏标记自动布局

```typescript
const layout = new FlexLayout({ autoLayout: true });

// 添加子项时自动标记
layout.addChild(child);

// 手动标记
layout.markDirty();

// 检查是否需要重算
if (layout.isDirty()) {
  layout.applyLayout();
}
```

---

## 2. 约束布局

### 基础用法

```typescript
import { ConstraintSolver } from 'gamex-engine';

const solver = new ConstraintSolver();

// 设置约束
solver.setConstraints(child, {
  left: 10,
  right: 10,
  top: 10,
  bottom: 10,
});

// 求解
solver.solve(parentWidth, parentHeight);
```

### 约束类型

| 属性 | 说明 |
|------|------|
| `left` | 左边距 |
| `right` | 右边距 |
| `top` | 上边距 |
| `bottom` | 下边距 |
| `centerX` | 水平中心偏移 |
| `centerY` | 垂直中心偏移 |
| `width` | 固定宽度 |
| `height` | 固定高度 |
| `aspectRatio` | 宽高比 |
| `minWidth` | 最小宽度 |
| `maxWidth` | 最大宽度 |
| `minHeight` | 最小高度 |
| `maxHeight` | 最大高度 |

### 便捷函数

```typescript
import {
  constraintMargins, constraintCenter,
  constraintSize, constraintFill, constraintRelative
} from 'gamex-engine';

// 固定边距
solver.setConstraints(child, constraintMargins(10, 10, 10, 10));

// 居中
solver.setConstraints(child, constraintCenter(0, 0));

// 固定尺寸
solver.setConstraints(child, constraintSize(200, 100));

// 填充（拉伸到父容器）
solver.setConstraints(child, constraintFill(10));

// 相对约束（相对另一个组件）
solver.setConstraints(child, constraintRelative(otherWidget, 'right', 1, 10));
```

### 相对约束

```typescript
solver.setConstraints(child, {
  left: { target: otherWidget, targetAttribute: 'right', multiplier: 1, constant: 10 },
  width: 200,
  top: 10,
  height: 50,
});
```

---

## 3. 滚动容器

### 基础用法

```typescript
import { ScrollView } from 'gamex-engine';

const scroll = new ScrollView(300, 400);
scroll.contentHeight = 1000; // 设置内容高度
scroll.direction = 'vertical';

// 添加内容
scroll.addChild(contentWidget);
```

### 配置选项

```typescript
const scroll = new ScrollView(300, 400);
scroll.direction = 'vertical';      // 'vertical' | 'horizontal' | 'both'
scroll.contentWidth = 800;
scroll.contentHeight = 2000;
scroll.elastic = true;              // 弹性回弹
scroll.elasticStrength = 0.2;       // 回弹强度
scroll.inertiaDecay = 0.95;         // 惯性衰减
scroll.scrollbar.visible = true;    // 显示滚动条
scroll.scrollbar.width = 4;
scroll.scrollbar.color = 'rgba(255,255,255,0.3)';
```

### 滚动控制

```typescript
// 滚动到指定位置
scroll.scrollTo(0, 500, 0.5); // x, y, 动画时长

// 滚动到边界
scroll.scrollToTop();
scroll.scrollToBottom();
scroll.scrollToLeft();
scroll.scrollToRight();

// 获取位置
const pos = scroll.getScrollPosition();
const ratio = scroll.getScrollRatio();
```

### 滚动事件

```typescript
scroll.onScroll = (event) => {
  console.log('滚动位置:', event.scrollX, event.scrollY);
  console.log('滚动比例:', event.scrollRatioX, event.scrollRatioY);
  console.log('是否滚动中:', event.isScrolling);
};
```

---

## 4. 虚拟列表

### 基础用法

```typescript
import { ListView } from 'gamex-engine';

const list = new ListView(300, 400, 50); // 宽度, 高度, 项目高度

// 设置数据
list.setData([
  { name: 'Item 1', value: 100 },
  { name: 'Item 2', value: 200 },
  // ... 大量数据
]);

// 渲染回调
list.renderItem = (item, index) => {
  const label = new Label(`${index}: ${item.name}`);
  label.width = 280;
  label.height = 45;
  return label;
};

// 刷新列表
list.refresh();
```

### 性能说明

虚拟列表只渲染可见区域的项目，滚动时自动回收和创建，支持 10000+ 条数据流畅滚动。

---

## 5. 统一布局容器

### 基础用法

```typescript
import { LayoutContainer } from 'gamex-engine';

const container = new LayoutContainer(400, 300);
container.setFlexLayout({
  direction: 'column',
  gap: 10,
  padding: { top: 10, right: 10, bottom: 10, left: 10 },
});

container.addWidget(new Button('OK'));
container.addWidget(new Label('Hello'));
```

### 快速创建

```typescript
import {
  createVerticalLayout,
  createHorizontalLayout,
  createCenterLayout,
  createScrollList
} from 'gamex-engine';

// 纵向布局
const vLayout = createVerticalLayout(10, 20);

// 横向布局
const hLayout = createHorizontalLayout(10, 20);

// 居中布局
const center = createCenterLayout();

// 滚动列表
const scrollList = createScrollList(50);
```

---

## 6. Panel 内置布局

### 基础用法

```typescript
import { Panel } from 'gamex-engine';

const panel = new Panel(300, 200);
panel.layout = 'vertical';   // 'none' | 'vertical' | 'horizontal' | 'grid'
panel.spacing = 10;
panel.clipContent = true;

panel.addWidget(new Button('Button 1'));
panel.addWidget(new Button('Button 2'));
panel.updateLayout();
```

---

## 7. 布局组合示例

### 游戏主菜单

```typescript
import { LayoutContainer, FlexLayout, Button, Label } from 'gamex-engine';

// 背景
const bg = new LayoutContainer(750, 1334);
bg.backgroundColor = '#1a1a2e';

// 标题
const title = new Label('My Game', 400, 60);
title.font = 'bold 36px sans-serif';
title.x = 175;
title.y = 200;

// 菜单按钮（Flex 布局）
const menuLayout = new FlexLayout({
  direction: 'column',
  gap: 20,
  padding: { top: 0, right: 100, bottom: 0, left: 100 },
});
menuLayout.addChild(new Button('开始游戏', 200, 50));
menuLayout.addChild(new Button('设置', 200, 50));
menuLayout.addChild(new Button('退出', 200, 50));
menuLayout.applyLayout(750, 1334);
menuLayout.y = 400;

bg.addChild(title);
bg.addChild(menuLayout);
```

### 聊天界面

```typescript
import { LayoutContainer, ScrollView, Label, Button } from 'gamex-engine';

// 消息列表
const chatScroll = new ScrollView(400, 500);
chatScroll.contentHeight = 2000;

// 添加消息
for (const msg of messages) {
  const label = new Label(msg.text, 350, 30);
  chatScroll.addChild(label);
}

// 输入框和发送按钮
const inputArea = new LayoutContainer(400, 60);
inputArea.setFlexLayout({ direction: 'row', gap: 10 });
inputArea.y = 510;

const sendBtn = new Button('发送', 80, 40);
inputArea.addFlexChild(sendBtn, { basis: 80 });
```

### 设置页面

```typescript
import { LayoutContainer, Label, ScrollView } from 'gamex-engine';

const settings = new ScrollView(400, 600);
settings.contentHeight = 1200;

// 音量设置
const volumeSection = new LayoutContainer(400, 100);
volumeSection.setFlexLayout({ direction: 'column', gap: 5 });
volumeSection.addFlexChild(new Label('音量', 200, 20));
// ... 添加滑块

settings.addChild(volumeSection);
```

---

## 8. 最佳实践

### 性能优化

1. **使用脏标记**：避免每帧调用 `applyLayout()`
2. **虚拟列表**：大数据量使用 `ListView` 而非 `ScrollView` + 手动管理
3. **减少嵌套**：布局嵌套过深会影响性能

### 布局选择

| 场景 | 推荐布局 |
|------|---------|
| 按钮行/列 | Flex 布局 |
| 固定位置元素 | 约束布局 |
| 长列表 | ScrollView / ListView |
| 简单分组 | Panel |
| 复杂界面 | LayoutContainer + Flex/Constraint |

### 响应式设计

```typescript
// 使用约束布局实现响应式
solver.setConstraints(widget, {
  left: '5%',      // 左边距 5%
  right: '5%',     // 右边距 5%
  top: 10,
  height: 50,
});

// 或使用百分比
const percentage = (pct: number) => ({
  type: 'width' as const,
  multiplier: pct / 100,
});
solver.setConstraints(widget, { width: percentage(80) });
```
