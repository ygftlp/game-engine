// 平台适配层：抽象出引擎所需的全部平台能力。
// 引擎核心只依赖本接口，绝不出现 wx / tt / document 等任何平台全局对象。
// 微信、抖音、H5 各自提供一个 IPlatform 实现（适配器）。

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

/** 归一化的指针点：触摸与鼠标均转换为此结构。 */
export interface PointerPoint {
  id: number;
  x: number;
  y: number;
}

export type PointerHandler = (points: PointerPoint[]) => void;

/**
 * 平台抽象接口。各端适配器（WxPlatform / TtPlatform / H5Platform）实现。
 * 引擎核心仅通过此接口访问平台能力，从而与具体平台解耦。
 */
export interface IPlatform {
  /** 平台标识，仅用于调试/日志。 */
  readonly name: string;
  createCanvas(): ICanvas;
  createImage(): IImage;
  createAudio(): IAudio;
  getScreenInfo(): ScreenInfo;
  /** 指针按下（触摸开始 / 鼠标按下）。 */
  onPointerStart(handler: PointerHandler): void;
  /** 指针移动。 */
  onPointerMove(handler: PointerHandler): void;
  /** 指针抬起 / 取消。 */
  onPointerEnd(handler: PointerHandler): void;
  /** 请求 JSON（小游戏用 request，H5 用 fetch）。 */
  requestJSON(url: string): Promise<unknown>;
  requestAnimationFrame(cb: (time: number) => void): number;
}
