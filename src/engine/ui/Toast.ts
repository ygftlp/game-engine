// 提示框组件：轻量级消息提示，自动消失。
import { UIWidget } from './UIWidget';
import { Renderer } from '../render/Renderer';
import { Node } from '../core/Node';

export type ToastPosition = 'top' | 'center' | 'bottom';

export class Toast extends UIWidget {
  /** 消息文本 */
  message = '';
  /** 显示时长（秒） */
  duration = 2;
  /** 位置 */
  position: ToastPosition = 'center';
  /** 背景色 */
  bgColor = 'rgba(0,0,0,0.7)';
  /** 文本颜色 */
  textColor = '#ffffff';
  /** 字体 */
  font = '14px sans-serif';

  private timer = 0;
  private fadeIn = 0;
  private showing = false;

  constructor() {
    super();
    this.width = 200;
    this.height = 40;
    this.borderRadius = 20;
    this.interactive = false;
    this.visible = false;
  }

  /** 显示提示 */
  show(message: string, duration?: number): void {
    this.message = message;
    this.duration = duration ?? this.duration;
    this.timer = 0;
    this.fadeIn = 0;
    this.showing = true;
    this.visible = true;

    // 根据位置设置y坐标
    switch (this.position) {
      case 'top':
        this.y = 100;
        break;
      case 'center':
        this.y = 0;
        break;
      case 'bottom':
        this.y = -100;
        break;
    }
  }

  /** 静态方法：快速显示（需传入父节点） */
  static show(message: string, duration?: number, parent?: Node): Toast {
    const toast = new Toast();
    if (parent) {
      parent.addChild(toast);
    }
    toast.show(message, duration);
    return toast;
  }

  update(dt: number): void {
    if (!this.showing) return;

    this.timer += dt;

    // 淡入动画
    if (this.fadeIn < 1) {
      this.fadeIn = Math.min(1, this.fadeIn + dt * 5);
      this.alpha = this.fadeIn;
    }

    // 自动消失
    if (this.timer >= this.duration) {
      this.fadeIn = Math.max(0, this.fadeIn - dt * 5);
      this.alpha = this.fadeIn;
      if (this.fadeIn <= 0) {
        this.showing = false;
        this.visible = false;
      }
    }
  }

  protected draw(renderer: Renderer): void {
    const ctx = renderer.ctx;

    // 测量文本宽度（只在消息变化时更新）
    ctx.font = this.font;
    const metrics = ctx.measureText(this.message);
    const newWidth = metrics.width + 40;
    if (this.width !== newWidth) {
      this.width = newWidth;
    }

    // 绘制背景
    ctx.fillStyle = this.bgColor;
    const x = -this.width * this.anchorX;
    const y = -this.height * this.anchorY;
    this.drawRoundRect(ctx, x, y, this.width, this.height, this.borderRadius);
    ctx.fill();

    // 绘制文本
    ctx.fillStyle = this.textColor;
    ctx.font = this.font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.message, 0, 0);
  }
}