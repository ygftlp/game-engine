// 滑块组件：支持水平/垂直、自定义样式、值显示。
import { UIWidget } from './UIWidget';
import { Renderer } from '../render/Renderer';
import { TouchPoint } from '../input/Input';
import { MathUtils } from '../utils/MathUtils';

export type SliderDirection = 'horizontal' | 'vertical';

export class Slider extends UIWidget {
  /** 当前值 */
  private _value = 0;
  /** 最小值 */
  minValue = 0;
  /** 最大值 */
  maxValue = 1;
  /** 步长（0表示连续） */
  step = 0;
  /** 值改变回调 */
  onChangeCallback: ((value: number) => void) | null = null;

  /** 轨道颜色 */
  trackColor = '#2d2d44';
  /** 填充颜色 */
  fillColor = '#4ecdc4';
  /** 滑块颜色 */
  thumbColor = '#ffffff';
  /** 轨道高度 */
  trackHeight = 4;
  /** 滑块半径 */
  thumbRadius = 10;
  /** 方向 */
  direction: SliderDirection = 'horizontal';
  /** 是否显示值 */
  showValue = false;

  constructor(width = 200, height = 20) {
    super();
    this.width = width;
    this.height = height;
  }

  /** 获取当前值 */
  get value(): number {
    return this._value;
  }

  /** 设置当前值 */
  set value(val: number) {
    val = MathUtils.clamp(val, this.minValue, this.maxValue);
    if (this.step > 0) {
      val = Math.round(val / this.step) * this.step;
    }
    if (this._value !== val) {
      this._value = val;
      if (this.onChangeCallback) {
        this.onChangeCallback(this._value);
      }
    }
  }

  /** 获取进度（0-1） */
  get progress(): number {
    return (this._value - this.minValue) / (this.maxValue - this.minValue);
  }

  /** 从触摸点更新值 */
  private updateFromTouch(point: TouchPoint): void {
    const local = this.worldMatrix.invertPoint(point.x, point.y);
    if (!local) return;
    const x = -this.width * this.anchorX;
    const y = -this.height * this.anchorY;

    let progress: number;
    if (this.direction === 'horizontal') {
      progress = (local.x - x) / this.width;
    } else {
      progress = (local.y - y) / this.height;
    }
    progress = MathUtils.clamp(progress, 0, 1);
    this.value = this.minValue + progress * (this.maxValue - this.minValue);
  }

  onTouchStart(point: TouchPoint): void {
    super.onTouchStart(point);
    this.updateFromTouch(point);
  }

  onTouchMove(point: TouchPoint): void {
    if (this._pressed) {
      this.updateFromTouch(point);
    }
  }

  protected draw(renderer: Renderer): void {
    const ctx = renderer.ctx;
    const x = -this.width * this.anchorX;
    const y = -this.height * this.anchorY;
    const progress = this.progress;

    // 绘制轨道背景
    ctx.fillStyle = this.trackColor;
    if (this.direction === 'horizontal') {
      const trackY = -this.trackHeight / 2;
      this.drawRoundRect(ctx, x, trackY, this.width, this.trackHeight, this.trackHeight / 2);
      ctx.fill();
    } else {
      const trackX = -this.trackHeight / 2;
      this.drawRoundRect(ctx, trackX, y, this.trackHeight, this.height, this.trackHeight / 2);
      ctx.fill();
    }

    // 绘制填充
    ctx.fillStyle = this.fillColor;
    if (this.direction === 'horizontal') {
      const fillWidth = this.width * progress;
      const trackY = -this.trackHeight / 2;
      this.drawRoundRect(ctx, x, trackY, fillWidth, this.trackHeight, this.trackHeight / 2);
      ctx.fill();
    } else {
      const fillHeight = this.height * progress;
      const trackX = -this.trackHeight / 2;
      this.drawRoundRect(ctx, trackX, y, this.trackHeight, fillHeight, this.trackHeight / 2);
      ctx.fill();
    }

    // 绘制滑块
    let thumbX: number, thumbY: number;
    if (this.direction === 'horizontal') {
      thumbX = x + this.width * progress;
      thumbY = 0;
    } else {
      thumbX = 0;
      thumbY = y + this.height * progress;
    }

    ctx.fillStyle = this.thumbColor;
    ctx.beginPath();
    ctx.arc(thumbX, thumbY, this.thumbRadius, 0, Math.PI * 2);
    ctx.fill();

    // 显示值
    if (this.showValue) {
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(this._value.toFixed(1), thumbX, thumbY + this.thumbRadius + 4);
    }
  }
}