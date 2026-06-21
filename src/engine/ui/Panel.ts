// 面板容器组件：用于组织和布局子UI组件。
import { UIWidget } from './UIWidget';
import { Renderer } from '../render/Renderer';

export type PanelLayout = 'none' | 'vertical' | 'horizontal' | 'grid';

export class Panel extends UIWidget {
  /** 布局方式 */
  layout: PanelLayout = 'none';
  /** 子组件间距 */
  spacing = 0;
  /** 是否裁剪超出区域的内容 */
  clipContent = false;

  constructor(width = 300, height = 200) {
    super();
    this.width = width;
    this.height = height;
    this.backgroundColor = '#1a1a2e';
    this.borderRadius = 8;
  }

  /** 添加子组件 */
  addWidget(widget: UIWidget): void {
    this.addChild(widget);
    this.updateLayout();
  }

  /** 移除子组件 */
  removeWidget(widget: UIWidget): void {
    this.removeChild(widget);
    this.updateLayout();
  }

  /** 更新布局 */
  updateLayout(): void {
    if (this.layout === 'none') return;

    const content = this.getContentRect();
    let offsetX = content.x;
    let offsetY = content.y;

    for (const child of this.children) {
      if (!(child instanceof UIWidget)) continue;

      switch (this.layout) {
        case 'vertical':
          child.x = offsetX + child.width * child.anchorX;
          child.y = offsetY + child.height * child.anchorY;
          offsetY += child.height + this.spacing;
          break;

        case 'horizontal':
          child.x = offsetX + child.width * child.anchorX;
          child.y = offsetY + child.height * child.anchorY;
          offsetX += child.width + this.spacing;
          break;

        case 'grid':
          // 网格布局：自动换行
          if (offsetX + child.width > content.x + content.width) {
            offsetX = content.x;
            offsetY += child.height + this.spacing;
          }
          child.x = offsetX + child.width * child.anchorX;
          child.y = offsetY + child.height * child.anchorY;
          offsetX += child.width + this.spacing;
          break;
      }
    }
  }

  protected draw(renderer: Renderer): void {
    const ctx = renderer.ctx;

    // 裁剪内容区域
    if (this.clipContent) {
      ctx.save();
      const x = -this.width * this.anchorX;
      const y = -this.height * this.anchorY;
      ctx.beginPath();
      ctx.rect(x, y, this.width, this.height);
      ctx.clip();
    }

    this.drawBackground(renderer);
  }

  /** 渲染完成后恢复裁剪 */
  visit(renderer: Renderer, parentMatrix: import('../math/Matrix2D').Matrix2D): void {
    super.visit(renderer, parentMatrix);
    if (this.clipContent) {
      renderer.ctx.restore();
    }
  }
}