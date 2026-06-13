// H5 浏览器平台适配器。所有对 document / window DOM API 的调用都集中在此文件。
// 鼠标事件被归一化为指针事件，与触摸统一。
import { IPlatform, ICanvas, IImage, IAudio, ScreenInfo, PointerHandler, PointerPoint } from './Platform';

export class H5Platform implements IPlatform {
  readonly name = 'h5';
  private canvas: HTMLCanvasElement | null = null;

  createCanvas(): ICanvas {
    const canvas = document.createElement('canvas');
    if (!this.canvas) {
      // 首个画布作为主画布挂载到页面，并作为事件源
      this.canvas = canvas;
      document.body.appendChild(canvas);
    }
    return canvas as unknown as ICanvas;
  }

  createImage(): IImage {
    return new Image() as unknown as IImage;
  }

  createAudio(): IAudio {
    const el = new Audio();
    // 适配 IAudio：HTMLAudioElement 用 pause+复位模拟 stop，destroy 为空操作
    const adapter: IAudio = {
      get src() {
        return el.src;
      },
      set src(v: string) {
        el.src = v;
      },
      get loop() {
        return el.loop;
      },
      set loop(v: boolean) {
        el.loop = v;
      },
      get volume() {
        return el.volume;
      },
      set volume(v: number) {
        el.volume = v;
      },
      play: () => {
        void el.play();
      },
      pause: () => el.pause(),
      stop: () => {
        el.pause();
        el.currentTime = 0;
      },
      destroy: () => {
        el.pause();
      }
    };
    return adapter;
  }

  getScreenInfo(): ScreenInfo {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      pixelRatio: window.devicePixelRatio || 1
    };
  }

  private target(): HTMLElement {
    return this.canvas ?? document.body;
  }

  private touchPoints(e: TouchEvent): PointerPoint[] {
    return Array.from(e.touches).map((t) => ({ id: t.identifier, x: t.clientX, y: t.clientY }));
  }

  private mousePoint(e: MouseEvent): PointerPoint[] {
    return [{ id: 0, x: e.clientX, y: e.clientY }];
  }

  onPointerStart(handler: PointerHandler): void {
    this.target().addEventListener('touchstart', (e) => handler(this.touchPoints(e as TouchEvent)));
    this.target().addEventListener('mousedown', (e) => handler(this.mousePoint(e as MouseEvent)));
  }

  onPointerMove(handler: PointerHandler): void {
    this.target().addEventListener('touchmove', (e) => handler(this.touchPoints(e as TouchEvent)));
    this.target().addEventListener('mousemove', (e) => handler(this.mousePoint(e as MouseEvent)));
  }

  onPointerEnd(handler: PointerHandler): void {
    this.target().addEventListener('touchend', () => handler([]));
    this.target().addEventListener('mouseup', () => handler([]));
  }

  async requestJSON(url: string): Promise<unknown> {
    const res = await fetch(url);
    return res.json();
  }

  requestAnimationFrame(cb: (time: number) => void): number {
    return window.requestAnimationFrame(cb);
  }
}
