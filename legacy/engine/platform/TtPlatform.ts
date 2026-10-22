// 抖音小游戏平台适配器。所有对 tt 的调用都集中在此文件。
// 抖音 API 与微信高度相似，但全局对象为 tt。
import { IPlatform, ICanvas, IImage, IAudio, ScreenInfo, PointerHandler } from './Platform';

declare const tt: TtApi;
declare const requestAnimationFrame: (cb: (time: number) => void) => number;

export class TtPlatform implements IPlatform {
  readonly name = 'douyin';

  createCanvas(): ICanvas {
    return tt.createCanvas() as unknown as ICanvas;
  }

  createImage(): IImage {
    return tt.createImage() as unknown as IImage;
  }

  createAudio(): IAudio {
    return tt.createInnerAudioContext() as unknown as IAudio;
  }

  getScreenInfo(): ScreenInfo {
    const info = tt.getSystemInfoSync();
    return { width: info.windowWidth, height: info.windowHeight, pixelRatio: info.pixelRatio };
  }

  getStorage(key: string): string | null {
    try {
      const value = tt.getStorageSync(key);
      if (typeof value === 'string') return value;
      if (value === null || value === undefined) return null;
      return JSON.stringify(value);
    } catch {
      return null;
    }
  }

  setStorage(key: string, value: string): void {
    try {
      tt.setStorageSync(key, value);
    } catch {
      // 存储失败不影响主流程。
    }
  }

  removeStorage(key: string): void {
    try {
      tt.removeStorageSync(key);
    } catch {
      // 存储失败不影响主流程。
    }
  }

  private wrap(handler: PointerHandler, source: 'touches' | 'changedTouches' = 'touches') {
    return (e: TtTouchEvent) => {
      handler(e[source].map((t) => ({ id: t.identifier, x: t.clientX, y: t.clientY })));
    };
  }

  onPointerStart(handler: PointerHandler): void {
    tt.onTouchStart(this.wrap(handler, 'touches'));
  }

  onPointerMove(handler: PointerHandler): void {
    tt.onTouchMove(this.wrap(handler, 'touches'));
  }

  onPointerEnd(handler: PointerHandler): void {
    tt.onTouchEnd(this.wrap(handler, 'changedTouches'));
    tt.onTouchCancel?.(this.wrap(handler, 'changedTouches'));
  }

  requestJSON(url: string): Promise<unknown> {
    return new Promise((resolve, reject) => {
      tt.request({ url, dataType: 'json', success: (res) => resolve(res.data), fail: (err) => reject(err) });
    });
  }

  requestAnimationFrame(cb: (time: number) => void): number {
    return requestAnimationFrame(cb);
  }
}
