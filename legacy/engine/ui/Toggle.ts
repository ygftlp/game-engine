// 开关组件：支持切换状态、自定义样式。
import { UIWidget } from './UIWidget';
import { Renderer } from '../render/Renderer';

export class Toggle extends UIWidget {
  /** 是否选中 */
  private _checked = false;
  /** 状态改变回调 */
  onChangeCallback: ((checked: boolean) => void) | null = null;

  /** 开启时背景色 */
  onColor = '#4ecdc4';
  /** 关闭时背景色 */
  offColor = '#95a5a6';
  /** 滑块颜色 */
  thumbColor = '#ffffff';
  /** 动画进度（0-1） */
  private animationProgress = 0;

  constructor(width = 50, height = 28) {
    super();
    this.width = width;
    this.height = height;
    this.borderRadius = height / 2;
  }

  /** 获取选中状态 */
  get checked(): boolean {
    return this._checked;
  }

  /** 设置选中状态 */
  set checked(val: boolean) {
    if (this._checked !== val) {
      this._checked = val;
      this.animationProgress = val ? 1 : 0;
    }
  }

  /** 切换状态 */
  toggle(): void {
    this._checked = !this._checked;
    if (this.onChangeCallback) {
      this.onChangeCallback(this._checked);
    }
  }

  update(dt: number): void {
    super.update(dt);
    // 动画过渡
    const target = this._checked ? 1 : 0;
    if (this.animationProgress !== target) {
      const speed = 5;
      if (Math.abs(this.animationProgress - target) < 0.01) {
        this.animationProgress = target;
      } else {
        this.animationProgress += (target - this.animationProgress) * speed * dt;
      }
    }
  }

  protected onClick(): void {
    this.toggle();
  }

  protected draw(renderer: Renderer): void {
    const ctx = renderer.ctx;
    const x = -this.width * this.anchorX;
    const y = -this.height * this.anchorY;
    const r = this.height / 2;

    // 绘制背景轨道
    const bgColor = this.lerpColor(this.offColor, this.onColor, this.animationProgress);
    ctx.fillStyle = bgColor;
    this.drawRoundRect(ctx, x, y, this.width, this.height, r);
    ctx.fill();

    // 绘制滑块
    const thumbRadius = r - 2;
    const thumbX = x + r + (this.width - this.height) * this.animationProgress;
    ctx.fillStyle = this.thumbColor;
    ctx.beginPath();
    ctx.arc(thumbX, 0, thumbRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  /** 颜色插值 */
  private lerpColor(color1: string, color2: string, t: number): string {
    const r1 = parseInt(color1.slice(1, 3), 16);
    const g1 = parseInt(color1.slice(3, 5), 16);
    const b1 = parseInt(color1.slice(5, 7), 16);
    const r2 = parseInt(color2.slice(1, 3), 16);
    const g2 = parseInt(color2.slice(3, 5), 16);
    const b2 = parseInt(color2.slice(5, 7), 16);

    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);

    return `rgb(${r},${g},${b})`;
  }
}