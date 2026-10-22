// 文本标签组件：支持多行文本、对齐、自动换行。
import { UIWidget, UIAlign, UIVAlign } from './UIWidget';
import { Renderer } from '../render/Renderer';

export class Label extends UIWidget {
  /** 文本内容 */
  text = '';
  /** 字体 */
  font = '16px sans-serif';
  /** 文本颜色 */
  color = '#ffffff';
  /** 水平对齐 */
  textAlign: UIAlign = 'left';
  /** 垂直对齐 */
  verticalAlign: UIVAlign = 'top';
  /** 是否自动换行 */
  wordWrap = false;
  /** 行高 */
  lineHeight = 1.5;
  /** 最大行数（0表示不限制） */
  maxLines = 0;

  constructor(text = '', width = 200, height = 30) {
    super();
    this.text = text;
    this.width = width;
    this.height = height;
    this.interactive = false;
  }

  /** 设置文本 */
  setText(text: string): void {
    this.text = text;
  }

  /** 设置字体大小 */
  setFontSize(size: number): void {
    this.font = this.font.replace(/\d+px/, `${size}px`);
  }

  /** 设置字体颜色 */
  setColor(color: string): void {
    this.color = color;
  }

  protected draw(renderer: Renderer): void {
    this.drawBackground(renderer);

    const ctx = renderer.ctx;
    ctx.fillStyle = this.color;
    ctx.font = this.font;

    // 设置对齐
    ctx.textAlign = this.textAlign === 'center' ? 'center' : this.textAlign === 'right' ? 'right' : 'left';
    ctx.textBaseline = this.verticalAlign === 'middle' ? 'middle' : this.verticalAlign === 'bottom' ? 'bottom' : 'top';

    const content = this.getContentRect();
    const fontSize = parseInt(this.font) || 16;
    const lineSpacing = fontSize * this.lineHeight;

    if (this.wordWrap) {
      // 自动换行
      const lines = this.wrapText(ctx, this.text, content.width);
      const startY = this.verticalAlign === 'middle' ? -((lines.length - 1) * lineSpacing) / 2 :
                     this.verticalAlign === 'bottom' ? content.height - lines.length * lineSpacing : 0;

      for (let i = 0; i < lines.length; i++) {
        if (this.maxLines > 0 && i >= this.maxLines) break;
        const x = this.textAlign === 'center' ? 0 : this.textAlign === 'right' ? content.width : 0;
        ctx.fillText(lines[i], x, startY + i * lineSpacing);
      }
    } else {
      // 单行文本
      const x = this.textAlign === 'center' ? 0 : this.textAlign === 'right' ? content.width : 0;
      const y = this.verticalAlign === 'middle' ? 0 : this.verticalAlign === 'bottom' ? content.height : 0;
      ctx.fillText(this.text, x, y);
    }
  }

  /** 文本换行处理 */
  private wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const lines: string[] = [];
    // 按单词分割（支持中英文混合）
    const words = text.split(/(\s+)/);
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine + word;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && currentLine.length > 0) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
    return lines;
  }
}