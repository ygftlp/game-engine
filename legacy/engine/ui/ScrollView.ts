// 滚动容器：支持垂直/水平/双向滚动、惯性滚动、滚动条、内容裁剪。

import { UIWidget } from './UIWidget';
import { Renderer } from '../render/Renderer';
import { TouchPoint } from '../input/Input';
import { Matrix2D } from '../math/Matrix2D';
import { Camera } from '../render/Camera';

/** 滚动方向 */
export type ScrollDirection = 'vertical' | 'horizontal' | 'both';

/** 滚动条配置 */
export interface ScrollbarConfig {
  /** 是否显示滚动条 */
  visible: boolean;
  /** 滚动条宽度 */
  width: number;
  /** 滚动条颜色 */
  color: string;
  /** 滚动条背景色 */
  backgroundColor: string;
  /** 滚动条圆角 */
  borderRadius: number;
}

/** 滚动事件 */
export interface ScrollEvent {
  /** 当前滚动位置 */
  scrollX: number;
  scrollY: number;
  /** 滚动比例 0-1 */
  scrollRatioX: number;
  scrollRatioY: number;
  /** 是否正在滚动 */
  isScrolling: boolean;
}

interface ScrollAnimation {
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  duration: number;
  elapsed: number;
}

/**
 * 滚动容器：裁剪内容并支持滚动。
 */
export class ScrollView extends UIWidget {
  /** 滚动方向 */
  direction: ScrollDirection = 'vertical';
  /** 内容宽度 */
  contentWidth = 0;
  /** 内容高度 */
  contentHeight = 0;
  /** 滚动条配置 */
  scrollbar: ScrollbarConfig = {
    visible: true,
    width: 4,
    color: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2,
  };
  /** 惯性滚动衰减 */
  inertiaDecay = 0.95;
  /** 弹性回弹 */
  elastic = true;
  /** 弹性回弹强度 */
  elasticStrength = 0.2;
  /** 滚动回调 */
  onScroll: ((event: ScrollEvent) => void) | null = null;

  private _scrollX = 0;
  private _scrollY = 0;
  private velocityX = 0;
  private velocityY = 0;
  private isDragging = false;
  private lastTouchX = 0;
  private lastTouchY = 0;
  private touchStartTime = 0;
  private scrollAnimation: ScrollAnimation | null = null;

  constructor(width = 200, height = 300) {
    super();
    this.width = width;
    this.height = height;
    this.backgroundColor = 'transparent';
    this.clipContent = true;
  }

  /** 获取当前滚动位置 */
  getScrollPosition(): { x: number; y: number } {
    return { x: this._scrollX, y: this._scrollY };
  }

  /** 设置滚动位置 */
  setScrollPosition(x: number, y: number): void {
    this.scrollAnimation = null;
    this.velocityX = 0;
    this.velocityY = 0;
    this._scrollX = this.clampTargetX(x);
    this._scrollY = this.clampTargetY(y);
    this.notifyScroll();
  }

  /** 滚动到指定位置（带动画） */
  scrollTo(x: number, y: number, duration = 0.3): void {
    const targetX = this.clampTargetX(x);
    const targetY = this.clampTargetY(y);
    if (duration <= 0) {
      this.setScrollPosition(targetX, targetY);
      return;
    }

    this.velocityX = 0;
    this.velocityY = 0;
    this.scrollAnimation = {
      startX: this._scrollX,
      startY: this._scrollY,
      targetX,
      targetY,
      duration,
      elapsed: 0,
    };
  }

  /** 滚动到顶部 */
  scrollToTop(duration?: number): void {
    this.scrollTo(this._scrollX, 0, duration);
  }

  /** 滚动到底部 */
  scrollToBottom(duration?: number): void {
    this.scrollTo(this._scrollX, this.getMaxScrollY(), duration);
  }

  /** 滚动到左侧 */
  scrollToLeft(duration?: number): void {
    this.scrollTo(0, this._scrollY, duration);
  }

  /** 滚动到右侧 */
  scrollToRight(duration?: number): void {
    this.scrollTo(this.getMaxScrollX(), this._scrollY, duration);
  }

  /** 获取最大滚动范围 */
  getMaxScrollX(): number {
    return Math.max(0, this.contentWidth - this.width);
  }

  /** 获取最大滚动范围 */
  getMaxScrollY(): number {
    return Math.max(0, this.contentHeight - this.height);
  }

  /** 获取滚动比例 */
  getScrollRatio(): { x: number; y: number } {
    const maxX = this.getMaxScrollX();
    const maxY = this.getMaxScrollY();
    return {
      x: maxX > 0 ? this._scrollX / maxX : 0,
      y: maxY > 0 ? this._scrollY / maxY : 0,
    };
  }

  /** 是否可以滚动 */
  canScrollX(): boolean {
    return this.direction === 'horizontal' || this.direction === 'both';
  }

  canScrollY(): boolean {
    return this.direction === 'vertical' || this.direction === 'both';
  }

  /** 处理触摸开始 */
  override onTouchStart(point: TouchPoint): void {
    this.isDragging = true;
    this.lastTouchX = point.x;
    this.lastTouchY = point.y;
    this.touchStartTime = Date.now();
    this.velocityX = 0;
    this.velocityY = 0;
    this.scrollAnimation = null;
  }

  /** 处理触摸移动 */
  override onTouchMove(point: TouchPoint): void {
    if (!this.isDragging) return;

    const dx = this.lastTouchX - point.x;
    const dy = this.lastTouchY - point.y;

    if (this.canScrollX()) {
      this._scrollX = this.clampScrollX(this._scrollX + dx);
    }
    if (this.canScrollY()) {
      this._scrollY = this.clampScrollY(this._scrollY + dy);
    }

    this.velocityX = dx;
    this.velocityY = dy;

    this.lastTouchX = point.x;
    this.lastTouchY = point.y;

    this.notifyScroll();
  }

  /** 处理触摸结束 */
  override onTouchEnd(_point: TouchPoint): void {
    this.isDragging = false;

    // 计算速度（基于最近的触摸移动）
    const elapsed = (Date.now() - this.touchStartTime) / 1000;
    if (elapsed < 0.3) {
      this.velocityX *= 3;
      this.velocityY *= 3;
    }
  }

  override onTouchCancel(): void {
    this.isDragging = false;
    this.velocityX = 0;
    this.velocityY = 0;
  }

  /** 每帧更新 */
  override update(dt: number): void {
    if (!this.isDragging) {
      this.updateScrollAnimation(dt);
      this.updateInertia(dt);
      this.updateElastic();
    }

    super.update(dt);
  }

  /** 绘制背景和滚动条 */
  protected draw(renderer: Renderer): void {
    this.drawBackground(renderer);

    if (this.scrollbar.visible) {
      this.drawScrollbar(renderer);
    }
  }

  /** 渲染子组件（应用滚动偏移，并同步 worldMatrix 以修复命中检测错位） */
  override visit(renderer: Renderer, parentMatrix: Matrix2D, camera?: Camera): void {
    if (!this.visible || this.alpha <= 0) return;

    const ctx = renderer.ctx;

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

    this.draw(renderer);

    if (this.clipContent) {
      const x = -this.width * this.anchorX;
      const y = -this.height * this.anchorY;
      ctx.beginPath();
      ctx.rect(x, y, this.width, this.height);
      ctx.clip();
    }

    // 裁剪区域已落到当前 canvas state 中，重置 transform 后让子节点使用绝对 worldMatrix 渲染。
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const contentMatrix = wm.clone();
    contentMatrix.applyTransform(-this._scrollX, -this._scrollY, 0, 1, 1);

    const ordered = this.getChildrenInRenderOrder();
    for (const child of ordered) {
      child.visit(renderer, contentMatrix, camera);
    }

    ctx.globalAlpha = prevAlpha;
    ctx.restore();
  }

  private updateScrollAnimation(dt: number): void {
    if (!this.scrollAnimation) return;

    const animation = this.scrollAnimation;
    animation.elapsed += dt;
    const t = Math.min(1, animation.elapsed / animation.duration);
    const ease = 1 - Math.pow(1 - t, 3); // easeOutCubic

    this._scrollX = animation.startX + (animation.targetX - animation.startX) * ease;
    this._scrollY = animation.startY + (animation.targetY - animation.startY) * ease;
    this.notifyScroll();

    if (t >= 1) {
      this.scrollAnimation = null;
    }
  }

  private updateInertia(dt: number): void {
    if (this.scrollAnimation) return;
    if (Math.abs(this.velocityX) <= 0.1 && Math.abs(this.velocityY) <= 0.1) return;

    this._scrollX = this.clampScrollX(this._scrollX + this.velocityX * dt * 60);
    this._scrollY = this.clampScrollY(this._scrollY + this.velocityY * dt * 60);

    const decay = Math.pow(this.inertiaDecay, dt * 60);
    this.velocityX *= decay;
    this.velocityY *= decay;

    if (Math.abs(this.velocityX) <= 0.1) this.velocityX = 0;
    if (Math.abs(this.velocityY) <= 0.1) this.velocityY = 0;

    this.notifyScroll();
  }

  private updateElastic(): void {
    if (!this.elastic || this.scrollAnimation) return;

    const targetX = this.clampTargetX(this._scrollX);
    const targetY = this.clampTargetY(this._scrollY);
    let changed = false;

    if (Math.abs(this._scrollX - targetX) > 0.1) {
      this._scrollX += (targetX - this._scrollX) * this.elasticStrength;
      changed = true;
    } else if (this._scrollX !== targetX) {
      this._scrollX = targetX;
      changed = true;
    }

    if (Math.abs(this._scrollY - targetY) > 0.1) {
      this._scrollY += (targetY - this._scrollY) * this.elasticStrength;
      changed = true;
    } else if (this._scrollY !== targetY) {
      this._scrollY = targetY;
      changed = true;
    }

    if (changed) this.notifyScroll();
  }

  private drawScrollbar(renderer: Renderer): void {
    const ctx = renderer.ctx;
    const x = -this.width * this.anchorX;
    const y = -this.height * this.anchorY;

    // 垂直滚动条
    if (this.canScrollY() && this.contentHeight > this.height) {
      const ratio = this.getScrollRatio();
      const barHeight = Math.max(20, (this.height / this.contentHeight) * this.height);
      const barY = y + ratio.y * (this.height - barHeight);

      ctx.fillStyle = this.scrollbar.backgroundColor;
      ctx.fillRect(x + this.width - this.scrollbar.width - 2, y, this.scrollbar.width, this.height);

      ctx.fillStyle = this.scrollbar.color;
      this.roundRect(ctx, x + this.width - this.scrollbar.width - 2, barY, this.scrollbar.width, barHeight, this.scrollbar.borderRadius);
      ctx.fill();
    }

    // 水平滚动条
    if (this.canScrollX() && this.contentWidth > this.width) {
      const ratio = this.getScrollRatio();
      const barWidth = Math.max(20, (this.width / this.contentWidth) * this.width);
      const barX = x + ratio.x * (this.width - barWidth);

      ctx.fillStyle = this.scrollbar.backgroundColor;
      ctx.fillRect(x, y + this.height - this.scrollbar.width - 2, this.width, this.scrollbar.width);

      ctx.fillStyle = this.scrollbar.color;
      this.roundRect(ctx, barX, y + this.height - this.scrollbar.width - 2, barWidth, this.scrollbar.width, this.scrollbar.borderRadius);
      ctx.fill();
    }
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    const radius = Math.max(0, Math.min(r, Math.min(w, h) / 2));
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  private clampScrollX(x: number): number {
    if (!this.canScrollX()) return 0;
    if (this.elastic) {
      const max = this.getMaxScrollX();
      if (x < 0) return x * 0.3;
      if (x > max) return max + (x - max) * 0.3;
    }
    return this.clampTargetX(x);
  }

  private clampScrollY(y: number): number {
    if (!this.canScrollY()) return 0;
    if (this.elastic) {
      const max = this.getMaxScrollY();
      if (y < 0) return y * 0.3;
      if (y > max) return max + (y - max) * 0.3;
    }
    return this.clampTargetY(y);
  }

  private clampTargetX(x: number): number {
    if (!this.canScrollX()) return 0;
    return Math.max(0, Math.min(this.getMaxScrollX(), x));
  }

  private clampTargetY(y: number): number {
    if (!this.canScrollY()) return 0;
    return Math.max(0, Math.min(this.getMaxScrollY(), y));
  }

  private notifyScroll(): void {
    if (this.onScroll) {
      const ratio = this.getScrollRatio();
      this.onScroll({
        scrollX: this._scrollX,
        scrollY: this._scrollY,
        scrollRatioX: ratio.x,
        scrollRatioY: ratio.y,
        isScrolling: this.isDragging || this.scrollAnimation !== null || Math.abs(this.velocityX) > 0.1 || Math.abs(this.velocityY) > 0.1,
      });
    }
  }
}

/**
 * 列表视图：基于 ScrollView 的虚拟列表。
 */
export class ListView extends ScrollView {
  /** 列表数据 */
  private data: unknown[] = [];
  /** 项目高度（固定） */
  itemHeight = 40;
  /** 项目宽度 */
  itemWidth = 0;
  /** 渲染项目回调 */
  renderItem: ((item: unknown, index: number) => UIWidget) | null = null;
  /** 可见项目缓存 */
  private visibleItems = new Map<number, UIWidget>();

  constructor(width: number, height: number, itemHeight = 40) {
    super(width, height);
    this.itemHeight = itemHeight;
    this.direction = 'vertical';
  }

  /** 设置数据 */
  setData(data: unknown[]): void {
    this.recycleAllVisibleItems();
    this.data = data;
    this.contentHeight = data.length * this.itemHeight;
    this.contentWidth = this.itemWidth || this.width;
    this.setScrollPosition(this.getScrollPosition().x, this.getScrollPosition().y);
  }

  /** 获取数据 */
  getData(): unknown[] {
    return this.data;
  }

  /** 刷新列表 */
  refresh(): void {
    this.recycleAllVisibleItems();
    this.updateVisibleItems();
  }

  /** 每帧更新 */
  override update(dt: number): void {
    super.update(dt);
    this.updateVisibleItems();
  }

  private updateVisibleItems(): void {
    if (!this.renderItem) return;

    const startIndex = Math.max(0, Math.floor(this.getScrollPosition().y / this.itemHeight));
    const endIndex = Math.min(
      this.data.length,
      Math.ceil((this.getScrollPosition().y + this.height) / this.itemHeight) + 1
    );

    // 回收不可见项目。
    for (const [index, widget] of [...this.visibleItems]) {
      if (index < startIndex || index >= endIndex) {
        this.removeChild(widget);
        this.visibleItems.delete(index);
      }
    }

    // 创建可见项目。
    for (let i = startIndex; i < endIndex; i++) {
      if (this.visibleItems.has(i)) continue;

      const widget = this.renderItem(this.data[i], i);
      widget.anchorX = 0;
      widget.anchorY = 0;
      widget.x = -this.width * this.anchorX;
      widget.y = -this.height * this.anchorY + i * this.itemHeight;
      widget.width = this.itemWidth || this.width;
      widget.height = this.itemHeight;
      widget.visible = true;

      this.addChild(widget);
      this.visibleItems.set(i, widget);
    }
  }

  private recycleAllVisibleItems(): void {
    for (const widget of this.visibleItems.values()) {
      this.removeChild(widget);
    }
    this.visibleItems.clear();
  }
}
