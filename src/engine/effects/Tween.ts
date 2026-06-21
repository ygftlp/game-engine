// 补间动画引擎：支持属性插值、缓动函数、链式调用、序列/并行编排。
import { EventEmitter } from '../core/EventEmitter';

/** 缓动函数 */
export type EasingFn = (t: number) => number;

/** 预定义缓动函数 */
export const Easing = {
  linear: (t: number) => t,
  easeInQuad: (t: number) => t * t,
  easeOutQuad: (t: number) => t * (2 - t),
  easeInOutQuad: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeInCubic: (t: number) => t * t * t,
  easeOutCubic: (t: number) => (--t) * t * t + 1,
  easeInOutCubic: (t: number) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  easeInQuart: (t: number) => t * t * t * t,
  easeOutQuart: (t: number) => 1 - (--t) * t * t * t,
  easeInOutQuart: (t: number) => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,
  easeInBack: (t: number) => t * t * (2.70158 * t - 1.70158),
  easeOutBack: (t: number) => 1 + (--t) * t * (2.70158 * t + 1.70158),
  easeOutBounce: (t: number) => {
    if (t < 1 / 2.75) return 7.5625 * t * t;
    if (t < 2 / 2.75) return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
    if (t < 2.5 / 2.75) return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
    return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
  },
  easeOutElastic: (t: number) => {
    if (t === 0 || t === 1) return t;
    return Math.pow(2, -10 * t) * Math.sin((t - 0.1) * 5 * Math.PI) + 1;
  },
} as const;

/** 单个补间配置 */
export interface TweenConfig {
  /** 目标属性值 */
  props: Record<string, number>;
  /** 持续时间（秒） */
  duration: number;
  /** 缓动函数 */
  easing?: EasingFn;
  /** 延迟开始（秒） */
  delay?: number;
  /** 重复次数（-1 = 无限） */
  repeat?: number;
  /** 是否往返 */
  yoyo?: boolean;
}

/** 补间事件 */
export interface TweenEvents {
  start: [];
  update: [number];
  complete: [];
  repeat: [number];
  yoyo: [];
}

/**
 * Tween 实例：对目标对象的属性进行插值动画。
 *
 * 使用示例：
 *   const tween = new Tween(sprite);
 *   tween.to({ x: 100, alpha: 0.5 }, 1, Easing.easeOutCubic);
 *   tween.to({ y: 200 }, 0.5, Easing.linear);
 *   tween.start();
 */
export class Tween {
  private target: Record<string, number>;
  private events = new EventEmitter();
  private queue: TweenConfig[] = [];
  private currentIndex = 0;
  private elapsed = 0;
  private delayRemaining = 0;
  private playing = false;
  private started = false;
  private repeatCount = 0;
  private yoyoFlip = false;
  private startValues: Record<string, number> = {};
  private currentConfig: TweenConfig | null = null;

  constructor(target: Record<string, number>) {
    this.target = target;
  }

  /** 添加一个补间阶段（可链式调用）。 */
  to(props: Record<string, number>, duration: number, easing: EasingFn = Easing.linear): this {
    this.queue.push({ props, duration, easing });
    return this;
  }

  /** 设置延迟。 */
  delay(seconds: number): this {
    if (this.queue.length > 0) {
      this.queue[this.queue.length - 1].delay = seconds;
    }
    return this;
  }

  /** 设置重复。 */
  repeat(times: number): this {
    if (this.queue.length > 0) {
      this.queue[this.queue.length - 1].repeat = times;
    }
    return this;
  }

  /** 设置往返。 */
  yoyo(enable = true): this {
    if (this.queue.length > 0) {
      this.queue[this.queue.length - 1].yoyo = enable;
    }
    return this;
  }

  /** 监听事件。 */
  on<K extends keyof TweenEvents>(event: K, fn: (...args: TweenEvents[K]) => void): this {
    this.events.on(event, fn as (...args: unknown[]) => void);
    return this;
  }

  /** 移除监听。 */
  off<K extends keyof TweenEvents>(event: K, fn: (...args: TweenEvents[K]) => void): this {
    this.events.off(event, fn as (...args: unknown[]) => void);
    return this;
  }

  /** 开始播放。 */
  start(): this {
    if (this.queue.length === 0) return this;
    this.playing = true;
    this.started = false;
    this.currentIndex = 0;
    this.elapsed = 0;
    this.repeatCount = 0;
    this.yoyoFlip = false;
    this.startCurrentPhase();
    return this;
  }

  /** 暂停。 */
  pause(): this {
    this.playing = false;
    return this;
  }

  /** 恢复。 */
  resume(): this {
    this.playing = true;
    return this;
  }

  /** 停止。 */
  stop(): this {
    this.playing = false;
    this.currentIndex = this.queue.length;
    return this;
  }

  /** 重置并重新开始。 */
  restart(): this {
    this.stop();
    this.start();
    return this;
  }

  /** 每帧更新（需要外部调用）。 */
  update(dt: number): void {
    if (!this.playing || this.queue.length === 0) return;

    // 延迟
    if (this.delayRemaining > 0) {
      this.delayRemaining -= dt;
      if (this.delayRemaining > 0) return;
      dt = -this.delayRemaining;
    }

    if (!this.started) {
      this.started = true;
      this.events.emit('start');
    }

    this.elapsed += dt;

    const config = this.currentConfig!;
    const duration = config.duration;
    const t = Math.min(this.elapsed / duration, 1);

    // 应用缓动
    const easedT = config.easing ? config.easing(t) : t;

    // 插值属性
    const scale = this.yoyoFlip ? -1 : 1;
    for (const key of Object.keys(config.props)) {
      const start = this.startValues[key] ?? this.target[key];
      const end = config.props[key];
      const diff = (end - start) * scale;
      this.target[key] = start + diff * easedT;
    }

    this.events.emit('update', easedT);

    // 完成当前阶段
    if (t >= 1) {
      // 最终值
      for (const key of Object.keys(config.props)) {
        const start = this.startValues[key] ?? this.target[key];
        const end = config.props[key];
        this.target[key] = this.yoyoFlip ? start : end;
      }

      // 处理重复
      if (config.repeat !== undefined && config.repeat !== 0) {
        this.repeatCount++;
        if (config.repeat === -1 || this.repeatCount <= config.repeat) {
          if (config.yoyo) {
            this.yoyoFlip = !this.yoyoFlip;
            this.events.emit('yoyo');
          }
          this.events.emit('repeat', this.repeatCount);
          this.elapsed = 0;
          this.startCurrentPhase();
          return;
        }
      }

      // 进入下一阶段
      this.currentIndex++;
      if (this.currentIndex < this.queue.length) {
        this.elapsed = 0;
        this.startCurrentPhase();
      } else {
        this.playing = false;
        this.events.emit('complete');
      }
    }
  }

  /** 是否正在播放。 */
  isPlaying(): boolean {
    return this.playing;
  }

  /** 是否已完成。 */
  isComplete(): boolean {
    return this.currentIndex >= this.queue.length;
  }

  private startCurrentPhase(): void {
    const config = this.queue[this.currentIndex];
    this.currentConfig = config;
    this.delayRemaining = config.delay ?? 0;

    // 记录起始值
    this.startValues = {};
    for (const key of Object.keys(config.props)) {
      this.startValues[key] = this.target[key];
    }

    if (this.delayRemaining > 0) {
      this.elapsed = 0;
    }
  }
}

/**
 * TweenManager：统一管理所有 Tween 实例的更新。
 */
export class TweenManager {
  private tweens = new Set<Tween>();

  /** 创建 Tween。 */
  create(target: Record<string, number>): Tween {
    const tween = new Tween(target);
    this.tweens.add(tween);
    tween.on('complete', () => this.tweens.delete(tween));
    return tween;
  }

  /** 每帧更新所有 Tween。 */
  update(dt: number): void {
    for (const tween of this.tweens) {
      tween.update(dt);
    }
  }

  /** 停止所有 Tween。 */
  stopAll(): void {
    for (const tween of this.tweens) {
      tween.stop();
    }
  }

  /** 暂停所有 Tween。 */
  pauseAll(): void {
    for (const tween of this.tweens) {
      tween.pause();
    }
  }

  /** 恢复所有 Tween。 */
  resumeAll(): void {
    for (const tween of this.tweens) {
      tween.resume();
    }
  }

  /** 移除所有 Tween。 */
  clear(): void {
    this.tweens.clear();
  }

  /** 活跃 Tween 数量。 */
  get count(): number {
    return this.tweens.size;
  }
}
