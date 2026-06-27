// 节点树：树状结构 + 变换（位置、旋转、缩放），支持父子坐标系。
// 增强：组件挂载（组合）、alpha 透明度、zIndex 层级、世界矩阵与命中检测。
import { Renderer } from '../render/Renderer';
import { Component } from './Component';
import { Matrix2D } from '../math/Matrix2D';
import { Camera } from '../render/Camera';

export class Node {
  x = 0;
  y = 0;
  rotation = 0; // 弧度
  scaleX = 1;
  scaleY = 1;
  visible = true;
  alpha = 1; // 透明度 0-1

  parent: Node | null = null;
  readonly children: Node[] = [];
  readonly components: Component[] = [];

  private _zIndex = 0;
  get zIndex(): number { return this._zIndex; }
  set zIndex(v: number) {
    if (this._zIndex === v) return;
    this._zIndex = v;
    if (this.parent) this.parent._childrenDirty = true;
  }

  private _childrenDirty = true;
  private _sortedAsc: Node[] = [];
  private _sortedDesc: Node[] = [];

  private _sortChildren(): void {
    if (!this._childrenDirty) return;
    this._sortedAsc = this.children.slice().sort((a, b) => a.zIndex - b.zIndex);
    this._sortedDesc = this._sortedAsc.slice().reverse();
    this._childrenDirty = false;
  }

  /** 本节点的世界变换矩阵，渲染时更新。 */
  readonly worldMatrix = new Matrix2D();

  // 节点的本地包围盒尺寸（用于命中检测），子类可设置。
  width = 0;
  height = 0;
  anchorX = 0.5;
  anchorY = 0.5;

  addChild(child: Node): Node {
    if (child.parent) child.parent.removeChild(child);
    child.parent = this;
    this.children.push(child);
    this._childrenDirty = true;
    return child;
  }

  removeChild(child: Node): void {
    const idx = this.children.indexOf(child);
    if (idx >= 0) {
      this.children.splice(idx, 1);
      child.parent = null;
      this._childrenDirty = true;
    }
  }

  removeFromParent(): void {
    if (this.parent) this.parent.removeChild(this);
  }

  getChildrenInRenderOrder(): Node[] {
    this._sortChildren();
    return this._sortedAsc;
  }

  /** 挂载组件（组合）。 */
  addComponent<T extends Component>(component: T): T {
    component.node = this;
    this.components.push(component);
    component.onAttach();
    return component;
  }

  getComponent<T extends Component>(type: new (...args: never[]) => T): T | null {
    for (const c of this.components) {
      if (c instanceof type) return c as T;
    }
    return null;
  }

  removeComponent(component: Component): void {
    const idx = this.components.indexOf(component);
    if (idx >= 0) {
      component.onDetach();
      this.components.splice(idx, 1);
    }
  }

  /** 递归更新：驱动本节点组件与子节点。 */
  update(dt: number): void {
    for (const c of this.components) {
      if (c.enabled) c.onUpdate(dt);
    }
    for (const child of this.children) child.update(dt);
  }

  protected draw(_renderer: Renderer): void {
    // 默认空实现，子类覆盖以绘制自身内容
  }

  visit(renderer: Renderer, parentMatrix: Matrix2D, camera?: Camera): void {
    if (!this.visible || this.alpha <= 0) return;

    const wm = this.worldMatrix;
    wm.a = parentMatrix.a;
    wm.b = parentMatrix.b;
    wm.c = parentMatrix.c;
    wm.d = parentMatrix.d;
    wm.e = parentMatrix.e;
    wm.f = parentMatrix.f;
    wm.applyTransform(this.x, this.y, this.rotation, this.scaleX, this.scaleY);

    if (camera && this.width > 0 && this.height > 0) {
      const l = -this.width * this.anchorX;
      const t = -this.height * this.anchorY;
      const r = l + this.width;
      const b = t + this.height;
      const x1 = wm.a * l + wm.c * t + wm.e;
      const y1 = wm.b * l + wm.d * t + wm.f;
      const x2 = wm.a * r + wm.c * t + wm.e;
      const y2 = wm.b * r + wm.d * t + wm.f;
      const x3 = wm.a * l + wm.c * b + wm.e;
      const y3 = wm.b * l + wm.d * b + wm.f;
      const x4 = wm.a * r + wm.c * b + wm.e;
      const y4 = wm.b * r + wm.d * b + wm.f;
      const minX = Math.min(x1, x2, x3, x4);
      const maxX = Math.max(x1, x2, x3, x4);
      const minY = Math.min(y1, y2, y3, y4);
      const maxY = Math.max(y1, y2, y3, y4);
      if (!camera.isVisible(minX, minY, maxX - minX, maxY - minY)) return;
    }

    const ctx = renderer.ctx;
    ctx.save();
    ctx.transform(wm.a, wm.b, wm.c, wm.d, wm.e, wm.f);
    const prevAlpha = ctx.globalAlpha;
    ctx.globalAlpha = prevAlpha * this.alpha;
    this.draw(renderer);
    ctx.globalAlpha = prevAlpha;
    ctx.restore();

    this._sortChildren();
    for (const child of this._sortedAsc) child.visit(renderer, wm, camera);
  }

  /** 本地点（已反变换到节点坐标系）是否落在节点包围盒内。 */
  protected containsLocalPoint(lx: number, ly: number): boolean {
    if (this.width <= 0 || this.height <= 0) return false;
    const left = -this.width * this.anchorX;
    const top = -this.height * this.anchorY;
    return lx >= left && lx <= left + this.width && ly >= top && ly <= top + this.height;
  }

  /** 世界坐标命中检测：返回最上层被命中的节点（考虑 zIndex）。 */
  hitTest(worldX: number, worldY: number): Node | null {
    if (!this.visible) return null;
    this._sortChildren();
    for (const child of this._sortedDesc) {
      const hit = child.hitTest(worldX, worldY);
      if (hit) return hit;
    }
    const local = this.worldMatrix.invertPoint(worldX, worldY);
    if (this.containsLocalPoint(local.x, local.y)) return this;
    return null;
  }
}
