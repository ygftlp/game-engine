// 多分辨率适配：设计分辨率 → 实际屏幕的缩放与居中适配。
import { ScreenInfo } from '../platform/Platform';

/** 适配模式 */
export type ScaleMode = 'fixed-width' | 'fixed-height' | 'fixed-auto' | 'no-border' | 'show-all';

/** 适配结果 */
export interface ScaleResult {
  /** 缩放比例 */
  scale: number;
  /** 水平偏移（居中） */
  offsetX: number;
  /** 垂直偏移（居中） */
  offsetY: number;
  /** 实际渲染宽度 */
  renderWidth: number;
  /** 实际渲染高度 */
  renderHeight: number;
}

/**
 * 多分辨率适配器。
 *
 * 设计分辨率 = 游戏逻辑坐标系的尺寸。
 * 实际分辨率 = 屏幕/画布的物理像素尺寸。
 *
 * 使用示例：
 *   const scaler = new ResolutionScaler(750, 1334); // iPhone 6/7/8 设计分辨率
 *   const result = scaler.calculate(platform.getScreenInfo());
 *   ctx.translate(result.offsetX, result.offsetY);
 *   ctx.scale(result.scale, result.scale);
 *   // 现在按设计分辨率绘制即可
 */
export class ResolutionScaler {
  /** 设计宽度 */
  readonly designWidth: number;
  /** 设计高度 */
  readonly designHeight: number;
  /** 适配模式 */
  mode: ScaleMode;

  constructor(designWidth: number, designHeight: number, mode: ScaleMode = 'fixed-height') {
    this.designWidth = designWidth;
    this.designHeight = designHeight;
    this.mode = mode;
  }

  /** 根据屏幕信息计算缩放结果。 */
  calculate(screen: ScreenInfo): ScaleResult {
    const actualW = screen.width;
    const actualH = screen.height;
    const dpr = screen.pixelRatio || 1;

    const physicalW = actualW * dpr;
    const physicalH = actualH * dpr;

    let scale: number;
    let offsetX = 0;
    let offsetY = 0;

    switch (this.mode) {
      case 'fixed-width':
        scale = physicalW / this.designWidth;
        break;
      case 'fixed-height':
        scale = physicalH / this.designHeight;
        break;
      case 'fixed-auto':
        scale = Math.min(physicalW / this.designWidth, physicalH / this.designHeight);
        break;
      case 'no-border':
        scale = Math.max(physicalW / this.designWidth, physicalH / this.designHeight);
        break;
      case 'show-all':
        scale = Math.min(physicalW / this.designWidth, physicalH / this.designHeight);
        offsetX = (physicalW - this.designWidth * scale) / 2;
        offsetY = (physicalH - this.designHeight * scale) / 2;
        break;
      default:
        scale = 1;
    }

    // 非 show-all 模式也需要居中
    if (this.mode !== 'show-all') {
      const renderW = this.designWidth * scale;
      const renderH = this.designHeight * scale;
      offsetX = (physicalW - renderW) / 2;
      offsetY = (physicalH - renderH) / 2;
    }

    return {
      scale,
      offsetX,
      offsetY,
      renderWidth: this.designWidth * scale,
      renderHeight: this.designHeight * scale,
    };
  }

  /** 将缩放结果应用到 Canvas 2D context。 */
  applyToContext(ctx: CanvasRenderingContext2D, screen: ScreenInfo): ScaleResult {
    const result = this.calculate(screen);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.translate(result.offsetX, result.offsetY);
    ctx.scale(result.scale, result.scale);
    return result;
  }

  /** 将屏幕坐标转换为设计分辨率坐标。 */
  screenToDesign(screenX: number, screenY: number, screen: ScreenInfo): { x: number; y: number } {
    const result = this.calculate(screen);
    return {
      x: (screenX - result.offsetX) / result.scale,
      y: (screenY - result.offsetY) / result.scale,
    };
  }

  /** 将设计分辨率坐标转换为屏幕坐标。 */
  designToScreen(designX: number, designY: number, screen: ScreenInfo): { x: number; y: number } {
    const result = this.calculate(screen);
    return {
      x: designX * result.scale + result.offsetX,
      y: designY * result.scale + result.offsetY,
    };
  }
}

/**
 * 安全区辅助：获取各平台安全区域信息。
 */
export interface SafeAreaInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/**
 * 自适应布局：根据设计分辨率和安全区计算可用区域。
 */
export class AdaptiveLayout {
  private scaler: ResolutionScaler;
  private safeArea: SafeAreaInsets;

  constructor(
    designWidth: number,
    designHeight: number,
    mode: ScaleMode = 'fixed-height',
    safeArea: SafeAreaInsets = { top: 0, bottom: 0, left: 0, right: 0 }
  ) {
    this.scaler = new ResolutionScaler(designWidth, designHeight, mode);
    this.safeArea = safeArea;
  }

  /** 获取缩放器。 */
  getScaler(): ResolutionScaler {
    return this.scaler;
  }

  /** 设置安全区。 */
  setSafeArea(area: SafeAreaInsets): void {
    this.safeArea = area;
  }

  /** 获取安全区域内的可用区域（设计分辨率坐标系）。 */
  getSafeRect(): { x: number; y: number; width: number; height: number } {
    const scale = this.scaler.calculate({ width: this.scaler.designWidth, height: this.scaler.designHeight, pixelRatio: 1 }).scale;
    return {
      x: this.safeArea.left / scale,
      y: this.safeArea.top / scale,
      width: this.scaler.designWidth - (this.safeArea.left + this.safeArea.right) / scale,
      height: this.scaler.designHeight - (this.safeArea.top + this.safeArea.bottom) / scale,
    };
  }

  /** 将节点自动适配到安全区域。 */
  adaptToSafeArea(node: { x: number; y: number; width: number; height: number }): void {
    const safe = this.getSafeRect();
    node.x = safe.x;
    node.y = safe.y;
  }
}
