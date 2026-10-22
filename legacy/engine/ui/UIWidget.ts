// UI组件基类：所有UI组件的父类，提供基础布局、交互和渲染能力。
import { Node } from '../core/Node';
import { Renderer } from '../render/Renderer';
import { Texture, TextureFrame } from '../render/Texture';
import { TouchPoint } from '../input/Input';

export type UIAlign = 'left' | 'center' | 'right';
export type UIVAlign = 'top' | 'middle' | 'bottom';
export type UIImageStretch = 'stretch' | 'tile' | 'contain' | 'cover';

export interface UIState {
  normal: boolean;
  hover: boolean;
  pressed: boolean;
  disabled: boolean;
}

export abstract class UIWidget extends Node {
  /** 是否可交互 */
  interactive = true;
  /** 是否禁用 */
  disabled = false;
  /** 是否阻止事件冒泡 */
  stopPropagation = false;
  /** 背景色 */
  backgroundColor: string | null = null;
  /** 背景图片 */
  backgroundImage: Texture | null = null;
  /** 背景图片帧（图集裁剪） */
  backgroundImageFrame: TextureFrame | null = null;
  /** 背景图片拉伸模式 */
  backgroundImageStretch: UIImageStretch = 'stretch';
  /** 边框色 */
  borderColor: string | null = null;
  /** 边框宽度 */
  borderWidth = 0;
  /** 圆角半径 */
  borderRadius = 0;
  /** 是否裁剪超出区域的内容 */
  clipContent = false;
  /** 内边距 */
  paddingLeft = 0;
  paddingRight = 0;
  paddingTop = 0;
  paddingBottom = 0;

  protected _state: UIState = { normal: true, hover: false, pressed: false, disabled: false };
  protected _pressed = false;

  /** 设置背景图片 */
  setBackgroundImage(texture: Texture, frame?: TextureFrame, stretch?: UIImageStretch): void {
    this.backgroundImage = texture;
    this.backgroundImageFrame = frame ?? null;
    this.backgroundImageStretch = stretch ?? 'stretch';
  }

  /** 清除背景图片 */
  clearBackgroundImage(): void {
    this.backgroundImage = null;
    this.backgroundImageFrame = null;
  }

  /** 设置内边距（上下左右统一） */
  setPadding(padding: number): void {
    this.paddingLeft = padding;
    this.paddingRight = padding;
    this.paddingTop = padding;
    this.paddingBottom = padding;
  }

  /** 检测点是否在组件内 */
  protected containsLocalPoint(lx: number, ly: number): boolean {
    if (!this.interactive || this.disabled) return false;
    const left = -this.width * this.anchorX;
    const top = -this.height * this.anchorY;
    return lx >= left && lx <= left + this.width && ly >= top && ly <= top + this.height;
  }

  /** 处理触摸开始 */
  onTouchStart(_point: TouchPoint): void {
    if (!this.interactive || this.disabled) return;
    this._pressed = true;
    this._state = { normal: false, hover: false, pressed: true, disabled: false };
    this.onPress();
  }

  /** 处理触摸移动 */
  onTouchMove(_point: TouchPoint): void {
    return;
  }

  /** 处理触摸结束 */
  onTouchEnd(_point: TouchPoint): void {
    if (!this.interactive || this.disabled) return;
    if (this._pressed) {
      this._pressed = false;
      this._state = { normal: true, hover: false, pressed: false, disabled: false };
      this.onRelease();
      this.onClick();
    }
  }

  /** 处理触摸取消 */
  onTouchCancel(): void {
    this._pressed = false;
    this._state = { normal: true, hover: false, pressed: false, disabled: false };
  }

  /** 按下回调（子类覆盖） */
  protected onPress(): void {
    return;
  }

  /** 释放回调（子类覆盖） */
  protected onRelease(): void {
    return;
  }

  /** 点击回调（子类覆盖） */
  protected onClick(): void {
    return;
  }

  /** 悬停开始回调（子类覆盖） */
  onHoverStart(): void {
    this._state.hover = true;
  }

  /** 悬停结束回调（子类覆盖） */
  onHoverEnd(): void {
    this._state.hover = false;
  }

  /** 绘制背景 */
  protected drawBackground(renderer: Renderer): void {
    const ctx = renderer.ctx;
    const x = -this.width * this.anchorX;
    const y = -this.height * this.anchorY;

    // 绘制背景图片
    if (this.backgroundImage && this.backgroundImage.loaded) {
      const img = this.backgroundImage.image as unknown as CanvasImageSource;
      
      if (this.borderRadius > 0) {
        ctx.save();
        this.drawRoundRect(ctx, x, y, this.width, this.height, this.borderRadius);
        ctx.clip();
      }

      if (this.backgroundImageFrame) {
        // 图集帧模式
        ctx.drawImage(
          img,
          this.backgroundImageFrame.x,
          this.backgroundImageFrame.y,
          this.backgroundImageFrame.width,
          this.backgroundImageFrame.height,
          x, y, this.width, this.height
        );
      } else if (this.backgroundImageStretch === 'stretch') {
        // 拉伸模式
        ctx.drawImage(img, x, y, this.width, this.height);
      } else if (this.backgroundImageStretch === 'contain') {
        // 包含模式（保持比例）
        const scale = Math.min(this.width / this.backgroundImage.width, this.height / this.backgroundImage.height);
        const w = this.backgroundImage.width * scale;
        const h = this.backgroundImage.height * scale;
        ctx.drawImage(img, x + (this.width - w) / 2, y + (this.height - h) / 2, w, h);
      } else if (this.backgroundImageStretch === 'cover') {
        // 覆盖模式（保持比例，裁剪溢出）
        const scale = Math.max(this.width / this.backgroundImage.width, this.height / this.backgroundImage.height);
        const w = this.backgroundImage.width * scale;
        const h = this.backgroundImage.height * scale;
        ctx.drawImage(img, x + (this.width - w) / 2, y + (this.height - h) / 2, w, h);
      } else if (this.backgroundImageStretch === 'tile') {
        // 平铺模式
        const pattern = ctx.createPattern(img, 'repeat');
        if (pattern) {
          ctx.fillStyle = pattern;
          ctx.fillRect(x, y, this.width, this.height);
        }
      }

      if (this.borderRadius > 0) {
        ctx.restore();
      }
    } else if (this.backgroundColor) {
      // 绘制背景色
      ctx.fillStyle = this.backgroundColor;
      if (this.borderRadius > 0) {
        this.drawRoundRect(ctx, x, y, this.width, this.height, this.borderRadius);
        ctx.fill();
      } else {
        ctx.fillRect(x, y, this.width, this.height);
      }
    }

    // 绘制边框
    if (this.borderColor && this.borderWidth > 0) {
      ctx.strokeStyle = this.borderColor;
      ctx.lineWidth = this.borderWidth;
      if (this.borderRadius > 0) {
        this.drawRoundRect(ctx, x, y, this.width, this.height, this.borderRadius);
        ctx.stroke();
      } else {
        ctx.strokeRect(x, y, this.width, this.height);
      }
    }
  }

  /** 绘制圆角矩形路径 */
  protected drawRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
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

  /** 获取内容区域（扣除内边距） */
  protected getContentRect(): { x: number; y: number; width: number; height: number } {
    return {
      x: -this.width * this.anchorX + this.paddingLeft,
      y: -this.height * this.anchorY + this.paddingTop,
      width: this.width - this.paddingLeft - this.paddingRight,
      height: this.height - this.paddingTop - this.paddingBottom,
    };
  }
}
