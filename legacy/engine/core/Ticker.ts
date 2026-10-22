// 游戏主循环：基于平台的 requestAnimationFrame，采用固定时间步长更新，update 与 render 分离。
import { IPlatform } from '../platform/Platform';

export type UpdateFn = (dt: number) => void;
export type RenderFn = () => void;

export class Ticker {
  private readonly fixedStep = 1 / 60;
  private accumulator = 0;
  private lastTime = 0;
  private running = false;

  constructor(
    private platform: IPlatform,
    private onUpdate: UpdateFn,
    private onRender: RenderFn
  ) {}

  start(): void {
    if (this.running) return;

    this.running = true;
    this.lastTime = 0;
    this.accumulator = 0;

    const loop = (time: number) => {
      if (!this.running) return;
      const now = time / 1000;
      if (this.lastTime === 0) this.lastTime = now;
      let frame = now - this.lastTime;
      this.lastTime = now;
      if (frame > 0.25) frame = 0.25;
      this.accumulator += frame;
      while (this.accumulator >= this.fixedStep) {
        this.onUpdate(this.fixedStep);
        this.accumulator -= this.fixedStep;
      }
      this.onRender();
      this.platform.requestAnimationFrame(loop);
    };

    this.platform.requestAnimationFrame(loop);
  }

  stop(): void {
    this.running = false;
    this.accumulator = 0;
    this.lastTime = 0;
  }
}
