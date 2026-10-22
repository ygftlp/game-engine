// 输入系统：封装平台指针事件，转换为引擎内坐标（考虑画布缩放比）。
// 与具体平台无关，只依赖 IPlatform 的指针回调。
import { IPlatform } from '../platform/Platform';

export interface TouchPoint {
  id: number;
  x: number;
  y: number;
}

export type InputListener = (touches: TouchPoint[]) => void;

export interface InputListenerOptions {
  persistent?: boolean;
}

interface ListenerEntry {
  fn: InputListener;
  persistent: boolean;
}

export class Input {
  private startListeners: ListenerEntry[] = [];
  private moveListeners: ListenerEntry[] = [];
  private endListeners: ListenerEntry[] = [];

  constructor(platform: IPlatform, private scale: number) {
    platform.onPointerStart((t) => this.emit(this.startListeners, t));
    platform.onPointerMove((t) => this.emit(this.moveListeners, t));
    platform.onPointerEnd((t) => this.emit(this.endListeners, t));
  }

  private emit(listeners: ListenerEntry[], raw: Array<{ id: number; x: number; y: number }>): void {
    const points = raw.map((p) => ({ id: p.id, x: p.x * this.scale, y: p.y * this.scale }));
    for (const entry of listeners) entry.fn(points);
  }

  onStart(fn: InputListener, options?: InputListenerOptions): void {
    this.startListeners.push({ fn, persistent: options?.persistent ?? false });
  }

  offStart(fn: InputListener): void {
    const idx = this.startListeners.findIndex((e) => e.fn === fn);
    if (idx >= 0) this.startListeners.splice(idx, 1);
  }

  onMove(fn: InputListener, options?: InputListenerOptions): void {
    this.moveListeners.push({ fn, persistent: options?.persistent ?? false });
  }

  offMove(fn: InputListener): void {
    const idx = this.moveListeners.findIndex((e) => e.fn === fn);
    if (idx >= 0) this.moveListeners.splice(idx, 1);
  }

  onEnd(fn: InputListener, options?: InputListenerOptions): void {
    this.endListeners.push({ fn, persistent: options?.persistent ?? false });
  }

  offEnd(fn: InputListener): void {
    const idx = this.endListeners.findIndex((e) => e.fn === fn);
    if (idx >= 0) this.endListeners.splice(idx, 1);
  }

  removeAllListeners(): void {
    this.startListeners = this.startListeners.filter((e) => e.persistent);
    this.moveListeners = this.moveListeners.filter((e) => e.persistent);
    this.endListeners = this.endListeners.filter((e) => e.persistent);
  }

  clearAll(): void {
    this.startListeners.length = 0;
    this.moveListeners.length = 0;
    this.endListeners.length = 0;
  }
}
