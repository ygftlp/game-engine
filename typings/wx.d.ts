// 微信小游戏全局 API 的最小类型声明（仅覆盖引擎用到的部分）
declare const wx: WxApi;

interface WxApi {
  createCanvas(): WxCanvas;
  createImage(): WxImage;
  createInnerAudioContext(): WxInnerAudioContext;
  getSystemInfoSync(): WxSystemInfo;
  onTouchStart(cb: (e: WxTouchEvent) => void): void;
  onTouchMove(cb: (e: WxTouchEvent) => void): void;
  onTouchEnd(cb: (e: WxTouchEvent) => void): void;
  onTouchCancel(cb: (e: WxTouchEvent) => void): void;
  request(opts: WxRequestOptions): void;
  getStorageSync(key: string): unknown;
  setStorageSync(key: string, value: unknown): void;
  getFileSystemManager(): unknown;
  reportAnalytics(eventName: string, data?: Record<string, unknown>): void;
}

interface WxSystemInfo {
  windowWidth: number;
  windowHeight: number;
  pixelRatio: number;
}

interface WxCanvas {
  width: number;
  height: number;
  getContext(type: '2d'): CanvasRenderingContext2D;
}

interface WxImage {
  src: string;
  width: number;
  height: number;
  onload: (() => void) | null;
  onerror: ((err: unknown) => void) | null;
}

interface WxInnerAudioContext {
  src: string;
  loop: boolean;
  volume: number;
  autoplay: boolean;
  play(): void;
  pause(): void;
  stop(): void;
  destroy(): void;
}

interface WxTouch {
  identifier: number;
  clientX: number;
  clientY: number;
  pageX: number;
  pageY: number;
}

interface WxTouchEvent {
  touches: WxTouch[];
  changedTouches: WxTouch[];
}

interface WxRequestOptions {
  url: string;
  data?: unknown;
  method?: string;
  dataType?: string;
  responseType?: string;
  success?: (res: { data: unknown; statusCode: number }) => void;
  fail?: (err: unknown) => void;
}
