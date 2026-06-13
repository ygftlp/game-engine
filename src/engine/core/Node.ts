// 节点树：树状结构 + 变换（位置、旋转、缩放），支持父子坐标系。
import { Renderer } from '../render/Renderer';

export class Node {
  x = 0;
  y = 0;
  rotation = 0;
  scaleX = 1;
  scaleY = 1;
  visible = true;

  parent: Node | null = null;
  readonly children: Node[] = [];

  addChild(child: Node): Node {
    if (child.parent) child.parent.removeChild(child);
    child.parent = this;
    this.children.push(child);
    return child;
  }

  removeChild(child: Node): void {
    const idx = this.children.indexOf(child);
    if (idx >= 0) {
      this.children.splice(idx, 1);
      child.parent = null;
    }
  }

  protected draw(_renderer: Renderer): void {
    // 默认空实现，子类覆盖以绘制自身内容
  }

  visit(renderer: Renderer): void {
    if (!this.visible) return;
    const ctx = renderer.ctx;
    ctx.save();
    ctx.translate(this.x, this.y);
    if (this.rotation !== 0) ctx.rotate(this.rotation);
    if (this.scaleX !== 1 || this.scaleY !== 1) ctx.scale(this.scaleX, this.scaleY);
    this.draw(renderer);
    for (const child of this.children) child.visit(renderer);
    ctx.restore();
  }
}
