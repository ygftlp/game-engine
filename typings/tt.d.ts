// 抖音小游戏全局 API 的最小类型声明（仅覆盖引擎用到的部分）
interface TtApi {
  createCanvas(): TtCanvas;
  createImage(): TtImage;
  createInnerAudioContext(): TtInnerAudioContext;
  getSystemInfoSync(): TtSystemInfo;
  onTouchStart(cb: (e: TtTouchEvent) => void): void;
  onTouchMove(cb: (e: TtTouchEvent) => void): void;
  onTouchEnd(cb: (e: TtTouchEvent) => void): void;
  request(opts: TtRequestOptions): void;
}

interface TtSystemInfo {
  windowWidth: number;
  windowHeight: number;
  pixelRatio: number;
}

interface TtCanvas {
  width: number;
  height: number;
  getContext(type: '2d'): CanvasRenderingContext2D;
}

interface TtImage {
  src: string;
  width: number;
  height: number;
  onload: (() => void) | null;
  onerror: ((err: unknown) => void) | null;
}

interface TtInnerAudioContext {
  src: string;
  loop: boolean;
  volume: number;
  play(): void;
  pause(): void;
  stop(): void;
  destroy(): void;
}

interface TtTouch {
  identifier: number;
  clientX: number;
  clientY: number;
}

interface TtTouchEvent {
  touches: TtTouch[];
  changedTouches: TtTouch[];
}

interface TtRequestOptions {
  url: string;
  data?: unknown;
  method?: string;
  dataType?: string;
  success?: (res: { data: unknown; statusCode: number }) => void;
  fail?: (err: unknown) => void;
}
