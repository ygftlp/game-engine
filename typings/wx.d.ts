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
  onError?: (cb: (message: string) => void) => void;
  request(opts: WxRequestOptions): void;
  connectSocket(opts: WxConnectSocketOptions): WxSocketTask;
  getStorageSync(key: string): unknown;
  setStorageSync(key: string, value: unknown): void;
  removeStorageSync(key: string): void;
  getFileSystemManager(): unknown;
  reportAnalytics(eventName: string, data?: Record<string, unknown>): void;
  requestMidasPayment(opts: WxMidasPaymentOptions): void;
  realnameAuthentication(opts: WxRealNameAuthenticationOptions): void;
  checkRealNameAuthentication(opts: WxCheckRealNameAuthenticationOptions): void;
}

interface WxSystemInfo {
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
  header?: Record<string, string>;
  dataType?: string;
  responseType?: string;
  success?: (res: { data: unknown; statusCode: number; header?: Record<string, string> }) => void;
  fail?: (err: unknown) => void;
}

interface WxConnectSocketOptions {
  url: string;
  protocols?: string[];
  header?: Record<string, string>;
  success?: (res: unknown) => void;
  fail?: (err: unknown) => void;
}

interface WxSocketTask {
  onOpen(cb: (res?: unknown) => void): void;
  onMessage(cb: (res: { data: string | ArrayBuffer }) => void): void;
  onClose(cb: (res: { code: number; reason: string }) => void): void;
  onError(cb: (err: unknown) => void): void;
  send(opts: { data: string | ArrayBuffer; success?: () => void; fail?: (err: unknown) => void }): void;
  close(opts?: { code?: number; reason?: string; success?: () => void; fail?: (err: unknown) => void }): void;
}

interface WxMidasPaymentOptions {
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

interface WxAuthSuccessResult {
  userId: string;
  age: number;
}

interface WxAuthCheckSuccessResult extends WxAuthSuccessResult {
  isAuthed: boolean;
}

interface WxAuthError {
  message: string;
  errMsg?: string;
}

interface WxRealNameAuthenticationOptions {
  success?: (res: WxAuthSuccessResult) => void;
  fail?: (err: WxAuthError) => void;
}

interface WxCheckRealNameAuthenticationOptions {
  success?: (res: WxAuthCheckSuccessResult) => void;
  fail?: (err: WxAuthError) => void;
}
