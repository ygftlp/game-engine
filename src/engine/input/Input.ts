// 输入系统：封装平台指针事件，转换为引擎内坐标（考虑画布缩放比）。
// 与具体平台无关，只依赖 IPlatform 的指针回调。
import { IPlatform } from '../platform/Platform';

export interface TouchPoint {
  id: number;
  x: number;
  y: number;
}

export type InputListener = (touches: TouchPoint[]) => void;

export class Input {
  private startListeners: InputListener[] = [];
  private moveListeners: InputListener[] = [];
  private endListeners: InputListener[] = [];

  constructor(platform: IPlatform, private scale: number) {
    platform.onPointerStart((t) => this.emit(this.startListeners, t));
    platform.onPointerMove((t) => this.emit(this.moveListeners, t));
    platform.onPointerEnd((t) => this.emit(this.endListeners, t));
  }

  private emit(listeners: InputListener[], raw: Array<{ id: number; x: number; y: number }>): void {
    const points = raw.map((p) => ({ id: p.id, x: p.x * this.scale, y: p.y * this.scale }));
    for (const fn of listeners) fn(points);
  }

  onStart(fn: InputListener): void {
    this.startListeners.push(fn);
  }

  onMove(fn: InputListener): void {
    this.moveListeners.push(fn);
  }

  onEnd(fn: InputListener): void {
    this.endListeners.push(fn);
  }
}
