// 输入系统：封装平台触摸事件，转换为引擎内坐标（考虑画布缩放比）。
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

  constructor(private platform: IPlatform, private scale: number) {
    this.platform.onTouchStart((t) => this.emit(this.startListeners, t));
    this.platform.onTouchMove((t) => this.emit(this.moveListeners, t));
    this.platform.onTouchEnd((t) => this.emit(this.endListeners, t));
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
