// 平台适配层：封装 wx.* API，隔离平台差异，便于未来扩展到 H5。

export interface ICanvas {
  width: number;
  height: number;
  getContext(type: '2d'): CanvasRenderingContext2D;
}

export interface IImage {
  src: string;
  width: number;
  height: number;
  onload: (() => void) | null;
  onerror: ((err: unknown) => void) | null;
}

export interface IAudio {
  src: string;
  loop: boolean;
  volume: number;
  play(): void;
  pause(): void;
  stop(): void;
  destroy(): void;
}

export interface ScreenInfo {
  width: number;
  height: number;
  pixelRatio: number;
}

export type TouchHandler = (touches: Array<{ id: number; x: number; y: number }>) => void;

export interface IPlatform {
  createCanvas(): ICanvas;
  createImage(): IImage;
  createAudio(): IAudio;
  getScreenInfo(): ScreenInfo;
  onTouchStart(handler: TouchHandler): void;
  onTouchMove(handler: TouchHandler): void;
  onTouchEnd(handler: TouchHandler): void;
  requestJSON(url: string): Promise<unknown>;
  requestAnimationFrame(cb: (time: number) => void): number;
}
