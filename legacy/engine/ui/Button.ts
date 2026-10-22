// 按钮组件：支持文本、图标、图片背景、多种状态样式。
import { UIWidget } from './UIWidget';
import { Renderer } from '../render/Renderer';
import { Texture, TextureFrame } from '../render/Texture';

export type ButtonState = 'normal' | 'pressed' | 'disabled';

export interface ButtonStyle {
  /** 正常状态背景色 */
  normalColor?: string;
  /** 按下状态背景色 */
  pressedColor?: string;
  /** 禁用状态背景色 */
  disabledColor?: string;
  /** 正常状态背景图片 */
  normalImage?: Texture;
  /** 按下状态背景图片 */
  pressedImage?: Texture;
  /** 禁用状态背景图片 */
  disabledImage?: Texture;
  /** 图片帧（图集裁剪） */
  imageFrame?: TextureFrame;
  /** 文本颜色 */
  textColor?: string;
  /** 文本字体 */
  font?: string;
  /** 圆角半径 */
  borderRadius?: number;
}

export class Button extends UIWidget {
  /** 按钮文本 */
  text = '';
  /** 点击回调 */
  onClickCallback: (() => void) | null = null;

  private normalColor: string;
  private pressedColor: string;
  private disabledColor: string;
  private normalImage: Texture | null = null;
  private pressedImage: Texture | null = null;
  private disabledImage: Texture | null = null;
  private imageFrame: TextureFrame | null = null;
  private textColor: string;
  private font: string;

  constructor(text = '', width = 120, height = 40) {
    super();
    this.text = text;
    this.width = width;
    this.height = height;

    this.normalColor = '#4ecdc4';
    this.pressedColor = '#45b7aa';
    this.disabledColor = '#95a5a6';
    this.textColor = '#ffffff';
    this.font = 'bold 16px sans-serif';
    this.borderRadius = 6;
    this.backgroundColor = this.normalColor;
  }

  /** 设置按钮样式 */
  setStyle(style: ButtonStyle): void {
    if (style.normalColor !== undefined) this.normalColor = style.normalColor;
    if (style.pressedColor !== undefined) this.pressedColor = style.pressedColor;
    if (style.disabledColor !== undefined) this.disabledColor = style.disabledColor;
    if (style.normalImage !== undefined) this.normalImage = style.normalImage;
    if (style.pressedImage !== undefined) this.pressedImage = style.pressedImage;
    if (style.disabledImage !== undefined) this.disabledImage = style.disabledImage;
    if (style.imageFrame !== undefined) this.imageFrame = style.imageFrame;
    if (style.textColor !== undefined) this.textColor = style.textColor;
    if (style.font !== undefined) this.font = style.font;
    if (style.borderRadius !== undefined) this.borderRadius = style.borderRadius;
    
    // 设置初始背景
    this.updateBackground();
  }

  /** 设置图片状态 */
  setImages(normal: Texture | null, pressed?: Texture | null, disabled?: Texture | null, frame?: TextureFrame): void {
    this.normalImage = normal;
    this.pressedImage = pressed ?? normal;
    this.disabledImage = disabled ?? normal;
    this.imageFrame = frame ?? null;
    this.updateBackground();
  }

  /** 根据当前状态更新背景 */
  private updateBackground(): void {
    if (this.disabled && this.disabledImage) {
      this.backgroundImage = this.disabledImage;
      this.backgroundImageFrame = this.imageFrame;
      this.backgroundColor = null;
    } else if (this._state.pressed && this.pressedImage) {
      this.backgroundImage = this.pressedImage;
      this.backgroundImageFrame = this.imageFrame;
      this.backgroundColor = null;
    } else if (this.normalImage) {
      this.backgroundImage = this.normalImage;
      this.backgroundImageFrame = this.imageFrame;
      this.backgroundColor = null;
    } else {
      this.backgroundImage = null;
      this.backgroundColor = this.disabled ? this.disabledColor : 
                             this._state.pressed ? this.pressedColor : this.normalColor;
    }
  }

  protected onPress(): void {
    this.updateBackground();
  }

  protected onRelease(): void {
    this.updateBackground();
  }

  protected onClick(): void {
    if (this.onClickCallback) {
      this.onClickCallback();
    }
  }

  protected draw(renderer: Renderer): void {
    this.drawBackground(renderer);

    const ctx = renderer.ctx;
    ctx.fillStyle = this.disabled ? '#cccccc' : this.textColor;
    ctx.font = this.font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.text, 0, 0);
  }
}