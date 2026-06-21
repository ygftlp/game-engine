// 进度条组件：支持水平/垂直、自定义样式、动画过渡。
import { UIWidget } from './UIWidget';
import { Renderer } from '../render/Renderer';
import { MathUtils } from '../utils/MathUtils';

export type ProgressBarDirection = 'horizontal' | 'vertical';

export class ProgressBar extends UIWidget {
  /** 当前值 */
  private _value = 0;
  /** 最小值 */
  minValue = 0;
  /** 最大值 */
  maxValue = 1;
  /** 背景轨道颜色 */
  trackColor = '#2d2d44';
  /** 进度条颜色 */
  fillColor = '#4ecdc4';
  /** 进度条方向 */
  direction: ProgressBarDirection = 'horizontal';
  /** 是否显示百分比文本 */
  showPercent = false;
  /** 文本颜色 */
  textColor = '#ffffff';
  /** 动画过渡速度（秒） */
  animationSpeed = 0;
  private _targetValue = 0;
  private _currentDisplayValue = 0;

  constructor(width = 200, height = 20) {
    super();
    this.width = width;
    this.height = height;
    this.interactive = false;
  }

  /** 获取当前值 */
  get value(): number {
    return this._value;
  }

  /** 设置当前值 */
  set value(val: number) {
    this._value = MathUtils.clamp(val, this.minValue, this.maxValue);
    this._targetValue = this._value;
    if (this.animationSpeed <= 0) {
      this._currentDisplayValue = this._value;
    }
  }

  /** 获取进度百分比（0-1） */
  get progress(): number {
    return (this._currentDisplayValue - this.minValue) / (this.maxValue - this.minValue);
  }

  /** 设置值（带动画） */
  setValueAnimated(val: number, duration?: number): void {
    this._targetValue = MathUtils.clamp(val, this.minValue, this.maxValue);
    if (duration !== undefined) {
      this.animationSpeed = duration;
    }
  }

  update(dt: number): void {
    super.update(dt);
    if (this.animationSpeed > 0 && this._currentDisplayValue !== this._targetValue) {
      const diff = this._targetValue - this._currentDisplayValue;
      const step = dt / this.animationSpeed;
      if (Math.abs(diff) < step) {
        this._currentDisplayValue = this._targetValue;
      } else {
        this._currentDisplayValue += diff * step;
      }
    }
  }

  protected draw(renderer: Renderer): void {
    const ctx = renderer.ctx;
    const x = -this.width * this.anchorX;
    const y = -this.height * this.anchorY;

    // 绘制背景轨道
    ctx.fillStyle = this.trackColor;
    if (this.borderRadius > 0) {
      this.drawRoundRect(ctx, x, y, this.width, this.height, this.borderRadius);
      ctx.fill();
    } else {
      ctx.fillRect(x, y, this.width, this.height);
    }

    // 绘制进度条
    const progress = this.progress;
    ctx.fillStyle = this.fillColor;

    if (this.direction === 'horizontal') {
      const fillWidth = this.width * progress;
      ctx.save();
      ctx.beginPath();
      if (this.borderRadius > 0) {
        this.drawRoundRect(ctx, x, y, this.width, this.height, this.borderRadius);
        ctx.clip();
      }
      ctx.fillRect(x, y, fillWidth, this.height);
      ctx.restore();
    } else {
      const fillHeight = this.height * progress;
      ctx.save();
      ctx.beginPath();
      if (this.borderRadius > 0) {
        this.drawRoundRect(ctx, x, y, this.width, this.height, this.borderRadius);
        ctx.clip();
      }
      ctx.fillRect(x, y + this.height - fillHeight, this.width, fillHeight);
      ctx.restore();
    }

    // 绘制百分比文本
    if (this.showPercent) {
      ctx.fillStyle = this.textColor;
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${Math.round(progress * 100)}%`, 0, 0);
    }
  }
}