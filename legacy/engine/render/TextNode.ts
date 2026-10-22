// 文本节点：在节点树中绘制文本，支持对齐与字体。
import { Node } from '../core/Node';
import { Renderer } from './Renderer';

export type TextAlign = 'left' | 'center' | 'right';

export class TextNode extends Node {
  constructor(
    public text = '',
    public color = '#ffffff',
    public font = '24px sans-serif',
    public align: TextAlign = 'center'
  ) {
    super();
    this.anchorX = 0;
    this.anchorY = 0;
  }

  protected draw(renderer: Renderer): void {
    const ctx = renderer.ctx;
    ctx.fillStyle = this.color;
    ctx.font = this.font;
    ctx.textAlign = this.align;
    ctx.textBaseline = 'middle';
    ctx.fillText(this.text, 0, 0);
  }
}
