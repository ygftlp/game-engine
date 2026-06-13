// 微信小游戏平台实现。所有对 wx 的调用都集中在此文件。
import { IPlatform, ICanvas, IImage, IAudio, ScreenInfo, TouchHandler } from './Platform';

declare const requestAnimationFrame: (cb: (time: number) => void) => number;

export class WxPlatform implements IPlatform {
  createCanvas(): ICanvas {
    return wx.createCanvas() as unknown as ICanvas;
  }

  createImage(): IImage {
    return wx.createImage() as unknown as IImage;
  }

  createAudio(): IAudio {
    const ctx = wx.createInnerAudioContext();
    return ctx as unknown as IAudio;
  }

  getScreenInfo(): ScreenInfo {
    const info = wx.getSystemInfoSync();
    return {
      width: info.windowWidth,
      height: info.windowHeight,
      pixelRatio: info.pixelRatio
    };
  }

  private wrapTouch(handler: TouchHandler) {
    return (e: WxTouchEvent) => {
      const list = e.touches.map((t) => ({ id: t.identifier, x: t.clientX, y: t.clientY }));
      handler(list);
    };
  }

  onTouchStart(handler: TouchHandler): void {
    wx.onTouchStart(this.wrapTouch(handler));
  }

  onTouchMove(handler: TouchHandler): void {
    wx.onTouchMove(this.wrapTouch(handler));
  }

  onTouchEnd(handler: TouchHandler): void {
    wx.onTouchEnd(this.wrapTouch(handler));
  }

  requestJSON(url: string): Promise<unknown> {
    return new Promise((resolve, reject) => {
      wx.request({
        url,
        dataType: 'json',
        success: (res) => resolve(res.data),
        fail: (err) => reject(err)
      });
    });
  }

  requestAnimationFrame(cb: (time: number) => void): number {
    return requestAnimationFrame(cb);
  }
}
