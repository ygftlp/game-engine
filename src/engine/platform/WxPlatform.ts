// 微信小游戏平台适配器。所有对 wx 的调用都集中在此文件。
import { IPlatform, ICanvas, IImage, IAudio, ScreenInfo, PointerHandler } from './Platform';

declare const wx: WxApi;
declare const requestAnimationFrame: (cb: (time: number) => void) => number;

export class WxPlatform implements IPlatform {
  readonly name = 'wechat';

  createCanvas(): ICanvas {
    return wx.createCanvas() as unknown as ICanvas;
  }

  createImage(): IImage {
    return wx.createImage() as unknown as IImage;
  }

  createAudio(): IAudio {
    return wx.createInnerAudioContext() as unknown as IAudio;
  }

  getScreenInfo(): ScreenInfo {
    const info = wx.getSystemInfoSync();
    return { width: info.windowWidth, height: info.windowHeight, pixelRatio: info.pixelRatio };
  }

  getStorage(key: string): string | null {
    try {
      const value = wx.getStorageSync(key);
      if (typeof value === 'string') return value;
      if (value === null || value === undefined) return null;
      return JSON.stringify(value);
    } catch {
      return null;
    }
  }

  setStorage(key: string, value: string): void {
    try {
      wx.setStorageSync(key, value);
    } catch {
      // 存储失败不影响主流程。
    }
  }

  private wrap(handler: PointerHandler, source: 'touches' | 'changedTouches' = 'touches') {
    return (e: WxTouchEvent) => {
      handler(e[source].map((t) => ({ id: t.identifier, x: t.clientX, y: t.clientY })));
    };
  }

  onPointerStart(handler: PointerHandler): void {
    wx.onTouchStart(this.wrap(handler, 'touches'));
  }

  onPointerMove(handler: PointerHandler): void {
    wx.onTouchMove(this.wrap(handler, 'touches'));
  }

  onPointerEnd(handler: PointerHandler): void {
    wx.onTouchEnd(this.wrap(handler, 'changedTouches'));
    wx.onTouchCancel(this.wrap(handler, 'changedTouches'));
  }

  requestJSON(url: string): Promise<unknown> {
    return new Promise((resolve, reject) => {
      wx.request({ url, dataType: 'json', success: (res) => resolve(res.data), fail: (err) => reject(err) });
    });
  }

  requestAnimationFrame(cb: (time: number) => void): number {
    return requestAnimationFrame(cb);
  }
}
