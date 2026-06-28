// 抖音小游戏全局 API 的最小类型声明（仅覆盖引擎用到的部分）
declare const tt: TtApi;

interface TtApi {
  createCanvas(): TtCanvas;
  createImage(): TtImage;
  createInnerAudioContext(): TtInnerAudioContext;
  getSystemInfoSync(): TtSystemInfo;
  onTouchStart(cb: (e: TtTouchEvent) => void): void;
  onTouchMove(cb: (e: TtTouchEvent) => void): void;
  onTouchEnd(cb: (e: TtTouchEvent) => void): void;
  onTouchCancel?: (cb: (e: TtTouchEvent) => void) => void;
  onError?: (cb: (message: string) => void) => void;
  request(opts: TtRequestOptions): void;
  connectSocket(opts: TtConnectSocketOptions): TtSocketTask;
  getStorageSync(key: string): unknown;
  setStorageSync(key: string, value: unknown): void;
  removeStorageSync(key: string): void;
  reportAnalytics(eventName: string, data?: Record<string, unknown>): void;
  requestGamePayment(opts: TtGamePaymentOptions): void;
}

interface TtSystemInfo {
  windowWidth: number;
  windowHeight: number;
  pixelRatio: number;
  safeArea?: {
    left: number;
    right: number;
    top: number;
    bottom: number;
    width: number;
    height: number;
  };
  statusBarHeight?: number;
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
  header?: Record<string, string>;
  dataType?: string;
  responseType?: string;
  success?: (res: { data: unknown; statusCode: number; header?: Record<string, string> }) => void;
  fail?: (err: unknown) => void;
}

interface TtConnectSocketOptions {
  url: string;
  protocols?: string[];
  header?: Record<string, string>;
  success?: (res: unknown) => void;
  fail?: (err: unknown) => void;
}

interface TtSocketTask {
  onOpen(cb: (res?: unknown) => void): void;
  onMessage(cb: (res: { data: string | ArrayBuffer }) => void): void;
  onClose(cb: (res: { code: number; reason: string }) => void): void;
  onError(cb: (err: unknown) => void): void;
  send(opts: { data: string | ArrayBuffer; success?: () => void; fail?: (err: unknown) => void }): void;
  close(opts?: { code?: number; reason?: string; success?: () => void; fail?: (err: unknown) => void }): void;
}

interface TtGamePaymentOptions {
  mode: string;
  env: number;
  offerId: string;
  currencyType: string;
  buyQuantity: number;
  zoneId: string;
  platform: string;
  success?: (res?: unknown) => void;
  fail?: (err: unknown) => void;
}
