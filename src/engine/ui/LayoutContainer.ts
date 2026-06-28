// 统一布局管理器：整合所有布局系统，提供统一 API 和脏标记自动布局。

import { UIWidget } from './UIWidget';
import { FlexLayout, FlexContainerConfig, FlexItemConfig } from './FlexLayout';
import { ScrollView } from './ScrollView';
import { ConstraintSolver, ConstraintConfig, constraintMargins } from './ConstraintLayout';
import { Matrix2D } from '../math/Matrix2D';
import { Renderer } from '../render/Renderer';

/** 布局类型 */
export type LayoutType = 'flex' | 'constraint' | 'absolute' | 'none';

/** 统一布局配置 */
export interface LayoutConfig {
  type?: LayoutType;
  /** Flex 布局配置 */
  flex?: FlexContainerConfig;
  /** 约束求解器 */
  constraints?: ConstraintSolver;
  /** 是否自动布局（脏标记） */
  autoLayout?: boolean;
}

/**
 * 布局容器：统一管理子组件布局。
 */
export class LayoutContainer extends UIWidget {
  /** 布局类型 */
  layoutType: LayoutType = 'none';
  /** Flex 布局引擎 */
  flex: FlexLayout | null = null;
  /** 约束求解器 */
  constraintSolver: ConstraintSolver | null = null;
  /** 是否启用自动布局 */
  autoLayout = true;
  /** 滚动容器（可选） */
  scrollView: ScrollView | null = null;

  private _layoutDirty = true;
  private lastWidth = 0;
  private lastHeight = 0;

  constructor(width = 200, height = 200, config?: LayoutConfig) {
    super();
    this.width = width;
    this.height = height;
    this.backgroundColor = 'transparent';

    if (config) {
      this.layoutType = config.type ?? 'none';
      if (config.flex) {
        this.flex = new FlexLayout(config.flex);
      }
      if (config.constraints) {
        this.constraintSolver = config.constraints;
      }
      if (config.autoLayout !== undefined) {
        this.autoLayout = config.autoLayout;
      }
    }
  }

  /** 设置为 Flex 布局 */
  setFlexLayout(config?: FlexContainerConfig): FlexLayout {
    this.layoutType = 'flex';
    this.flex = new FlexLayout(config);
    this.markDirty();
    return this.flex;
  }

  /** 设置为约束布局 */
  setConstraintLayout(solver?: ConstraintSolver): ConstraintSolver {
    this.layoutType = 'constraint';
    this.constraintSolver = solver ?? new ConstraintSolver();
    this.markDirty();
    return this.constraintSolver;
  }

  /** 设置为滚动布局 */
  setScrollLayout(direction: 'vertical' | 'horizontal' | 'both' = 'vertical'): ScrollView {
    this.scrollView = new ScrollView(this.width, this.height);
    this.scrollView.direction = direction;
    this.addChild(this.scrollView);
    this.markDirty();
    return this.scrollView;
  }

  /** 添加子组件到 Flex 布局 */
  addFlexChild(child: UIWidget, itemConfig?: FlexItemConfig): void {
    this.flex?.addChild(child, itemConfig);
    this.markDirty();
  }

  /** 添加子组件到约束布局 */
  addConstraintChild(child: UIWidget, config: ConstraintConfig): void {
    this.constraintSolver?.setConstraints(child, config);
    this.markDirty();
  }

  /** 添加子组件（自动选择布局） */
  addWidget(widget: UIWidget): void {
    this.addChild(widget);
    this.markDirty();
  }

  /** 移除子组件 */
  removeWidget(widget: UIWidget): void {
    this.removeChild(widget);
    this.flex?.removeChild(widget);
    this.constraintSolver?.removeConstraints(widget);
    this.markDirty();
  }

  /** 标记布局需要重新计算 */
  markDirty(): void {
    this._layoutDirty = true;
  }

  /** 是否需要重新布局 */
  isDirty(): boolean {
    return this._layoutDirty;
  }

  /** 强制应用布局 */
  applyLayout(): void {
    this.applyLayoutInternal();
  }

  /** 每帧更新 */
  update(dt: number): void {
    if (this.autoLayout && this._layoutDirty) {
      this.applyLayoutInternal();
    }

    // 检测尺寸变化
    if (this.width !== this.lastWidth || this.height !== this.lastHeight) {
      this.lastWidth = this.width;
      this.lastHeight = this.height;
      this.markDirty();
    }

    // 更新子组件
    for (const child of this.children) {
      child.update(dt);
    }
  }

  /** 绘制背景 */
  protected draw(renderer: Renderer): void {
    this.drawBackground(renderer);
  }

  /** 渲染子组件 */
  override visit(renderer: Renderer, parentMatrix: Matrix2D): void {
    if (!this.visible || this.alpha <= 0) return;

    const ctx = renderer.ctx;

    // 计算世界矩阵
    const wm = this.worldMatrix;
    wm.a = parentMatrix.a;
    wm.b = parentMatrix.b;
    wm.c = parentMatrix.c;
    wm.d = parentMatrix.d;
    wm.e = parentMatrix.e;
    wm.f = parentMatrix.f;
    wm.applyTransform(this.x, this.y, this.rotation, this.scaleX, this.scaleY);

    ctx.save();
    ctx.transform(wm.a, wm.b, wm.c, wm.d, wm.e, wm.f);
    const prevAlpha = ctx.globalAlpha;
    ctx.globalAlpha = prevAlpha * this.alpha;

    // 绘制自身
    this.draw(renderer);

    // 裁剪内容区域
    if (this.clipContent) {
      ctx.save();
      const x = -this.width * this.anchorX;
      const y = -this.height * this.anchorY;
      ctx.beginPath();
      ctx.rect(x, y, this.width, this.height);
      ctx.clip();
    }

    // 绘制子组件
    const ordered = this.getChildrenInRenderOrder();
    for (const child of ordered) {
      child.visit(renderer, wm);
    }

    if (this.clipContent) {
      ctx.restore();
    }

    ctx.globalAlpha = prevAlpha;
    ctx.restore();
  }

  private applyLayoutInternal(): void {
    switch (this.layoutType) {
      case 'flex':
        this.flex?.applyLayout(this.width, this.height);
        break;
      case 'constraint':
        this.constraintSolver?.solve(this.width, this.height);
        break;
    }
    this._layoutDirty = false;
  }
}

// ========== 便捷布局创建 ==========

/** 创建 Flex 纵向布局 */
export function createVerticalLayout(gap = 10, padding = 10): LayoutContainer {
  const container = new LayoutContainer();
  container.setFlexLayout({
    direction: 'column',
    gap,
    padding: { top: padding, right: padding, bottom: padding, left: padding },
    autoSize: true,
  });
  return container;
}

/** 创建 Flex 横向布局 */
export function createHorizontalLayout(gap = 10, padding = 10): LayoutContainer {
  const container = new LayoutContainer();
  container.setFlexLayout({
    direction: 'row',
    gap,
    padding: { top: padding, right: padding, bottom: padding, left: padding },
    autoSize: true,
  });
  return container;
}

/** 创建居中布局 */
export function createCenterLayout(): LayoutContainer {
  const container = new LayoutContainer();
  const solver = new ConstraintSolver();
  container.setConstraintLayout(solver);
  return container;
}

/** 创建填充布局 */
export function createFillLayout(margin = 10): LayoutContainer {
  const container = new LayoutContainer();
  const solver = new ConstraintSolver();
  container.setConstraintLayout(solver);
  solver.setConstraints(container, constraintMargins(margin, margin, margin, margin));
  return container;
}

/** 创建滚动列表布局 */
export function createScrollList(itemHeight = 40): LayoutContainer {
  const container = new LayoutContainer();
  const scroll = container.setScrollLayout('vertical');
  (scroll as any).itemHeight = itemHeight;
  return container;
}
