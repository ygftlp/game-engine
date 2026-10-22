// 屏幕适配系统：处理不同设备的屏幕尺寸、安全区、刘海屏适配。
export interface ScreenAdapterConfig {
  /** 设计宽度 */
  designWidth: number;
  /** 设计高度 */
  designHeight: number;
  /** 适配模式 */
  fitMode: 'width' | 'height' | 'auto' | 'contain' | 'cover';
  /** 是否启用安全区适配 */
  enableSafeArea: boolean;
}

export interface SafeArea {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export class ScreenAdapter {
  private config: ScreenAdapterConfig;
  private screenWidth: number;
  private screenHeight: number;
  private pixelRatio: number;
  private safeArea: SafeArea = { top: 0, bottom: 0, left: 0, right: 0 };

  /** 缩放比例 */
  private _scaleX = 1;
  private _scaleY = 1;
  private _scale = 1;

  /** 偏移量（用于contain模式） */
  private _offsetX = 0;
  private _offsetY = 0;

  /** 实际渲染区域 */
  private _renderWidth: number;
  private _renderHeight: number;

  constructor(screenWidth: number, screenHeight: number, pixelRatio: number, config?: Partial<ScreenAdapterConfig>) {
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
    this.pixelRatio = pixelRatio;

    this.config = {
      designWidth: 750,
      designHeight: 1334,
      fitMode: 'auto',
      enableSafeArea: true,
      ...config
    };

    this._renderWidth = screenWidth * pixelRatio;
    this._renderHeight = screenHeight * pixelRatio;

    this.calculateScale();
  }

  /** 计算缩放比例 */
  private calculateScale(): void {
    const { designWidth, designHeight, fitMode } = this.config;
    const realWidth = this.screenWidth * this.pixelRatio;
    const realHeight = this.screenHeight * this.pixelRatio;

    this._scaleX = realWidth / designWidth;
    this._scaleY = realHeight / designHeight;

    switch (fitMode) {
      case 'width':
        this._scale = this._scaleX;
        this._offsetX = 0;
        this._offsetY = (realHeight - designHeight * this._scale) / 2;
        break;

      case 'height':
        this._scale = this._scaleY;
        this._offsetX = (realWidth - designWidth * this._scale) / 2;
        this._offsetY = 0;
        break;

      case 'contain':
        this._scale = Math.min(this._scaleX, this._scaleY);
        this._offsetX = (realWidth - designWidth * this._scale) / 2;
        this._offsetY = (realHeight - designHeight * this._scale) / 2;
        break;

      case 'cover':
        this._scale = Math.max(this._scaleX, this._scaleY);
        this._offsetX = (realWidth - designWidth * this._scale) / 2;
        this._offsetY = (realHeight - designHeight * this._scale) / 2;
        break;

      case 'auto':
      default:
        this._scale = Math.min(this._scaleX, this._scaleY);
        this._offsetX = (realWidth - designWidth * this._scale) / 2;
        this._offsetY = (realHeight - designHeight * this._scale) / 2;
        break;
    }
  }

  /** 设置安全区 */
  setSafeArea(safeArea: Partial<SafeArea>): void {
    this.safeArea = { ...this.safeArea, ...safeArea };
  }

  /** 获取安全区（考虑缩放） */
  getScaledSafeArea(): SafeArea {
    return {
      top: this.safeArea.top * this.pixelRatio,
      bottom: this.safeArea.bottom * this.pixelRatio,
      left: this.safeArea.left * this.pixelRatio,
      right: this.safeArea.right * this.pixelRatio
    };
  }

  /** 设计坐标转屏幕坐标 */
  designToScreen(x: number, y: number): { x: number; y: number } {
    return {
      x: x * this._scale + this._offsetX,
      y: y * this._scale + this._offsetY
    };
  }

  /** 屏幕坐标转设计坐标 */
  screenToDesign(x: number, y: number): { x: number; y: number } {
    return {
      x: (x - this._offsetX) / this._scale,
      y: (y - this._offsetY) / this._scale
    };
  }

  /** 获取缩放比例 */
  get scale(): number {
    return this._scale;
  }

  /** 获取X轴缩放比例 */
  get scaleX(): number {
    return this._scaleX;
  }

  /** 获取Y轴缩放比例 */
  get scaleY(): number {
    return this._scaleY;
  }

  /** 获取X轴偏移量 */
  get offsetX(): number {
    return this._offsetX;
  }

  /** 获取Y轴偏移量 */
  get offsetY(): number {
    return this._offsetY;
  }

  /** 获取渲染宽度 */
  get renderWidth(): number {
    return this._renderWidth;
  }

  /** 获取渲染高度 */
  get renderHeight(): number {
    return this._renderHeight;
  }

  /** 获取设计宽度 */
  get designWidth(): number {
    return this.config.designWidth;
  }

  /** 获取设计高度 */
  get designHeight(): number {
    return this.config.designHeight;
  }

  /** 更新屏幕尺寸（屏幕旋转时调用） */
  updateScreenSize(width: number, height: number): void {
    this.screenWidth = width;
    this.screenHeight = height;
    this._renderWidth = width * this.pixelRatio;
    this._renderHeight = height * this.pixelRatio;
    this.calculateScale();
  }

  /** 检测是否为刘海屏 */
  isNotchScreen(): boolean {
    // 简单判断：安全区顶部大于20认为是刘海屏
    return this.safeArea.top > 20;
  }

  /** 获取状态栏高度 */
  getStatusBarHeight(): number {
    return this.safeArea.top;
  }

  /** 获取底部安全区高度 */
  getBottomSafeHeight(): number {
    return this.safeArea.bottom;
  }
}