// 定时器工具：提供延迟执行、循环执行、帧延迟执行等能力。
export class TimerManager {
  private timers: Timer[] = [];
  private nextId = 0;

  /** 延迟执行（秒）。 */
  delay(callback: () => void, seconds: number): number {
    const id = this.nextId++;
    this.timers.push(new Timer(id, callback, seconds, false));
    return id;
  }

  /** 循环执行（秒）。 */
  interval(callback: () => void, seconds: number): number {
    const id = this.nextId++;
    this.timers.push(new Timer(id, callback, seconds, true));
    return id;
  }

  /** 取消定时器。 */
  cancel(id: number): void {
    const idx = this.timers.findIndex((t) => t.id === id);
    if (idx >= 0) {
      this.timers.splice(idx, 1);
    }
  }

  /** 暂停定时器。 */
  pause(id: number): void {
    const timer = this.timers.find((t) => t.id === id);
    if (timer) timer.paused = true;
  }

  /** 恢复定时器。 */
  resume(id: number): void {
    const timer = this.timers.find((t) => t.id === id);
    if (timer) timer.paused = false;
  }

  /** 清除所有定时器。 */
  clear(): void {
    this.timers.length = 0;
  }

  /** 每帧调用，更新所有定时器。 */
  update(dt: number): void {
    for (let i = this.timers.length - 1; i >= 0; i--) {
      const timer = this.timers[i];
      if (timer.paused) continue;

      timer.elapsed += dt;
      if (timer.elapsed >= timer.duration) {
        timer.callback();
        if (timer.repeat) {
          timer.elapsed -= timer.duration;
        } else {
          this.timers.splice(i, 1);
        }
      }
    }
  }

  /** 获取活跃定时器数量。 */
  get size(): number {
    return this.timers.length;
  }
}

class Timer {
  elapsed = 0;
  paused = false;

  constructor(
    public id: number,
    public callback: () => void,
    public duration: number,
    public repeat: boolean
  ) {}
}