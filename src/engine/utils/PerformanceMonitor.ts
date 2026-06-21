// 性能监控系统：FPS、内存、帧时间、渲染统计、性能警告。

import { EventEmitter } from '../core/EventEmitter';

/** 性能指标 */
export interface PerformanceMetrics {
  /** 当前 FPS */
  fps: number;
  /** 平均 FPS */
  avgFps: number;
  /** 最小 FPS */
  minFps: number;
  /** 最大 FPS */
  maxFps: number;
  /** 帧时间（ms） */
  frameTime: number;
  /** 平均帧时间 */
  avgFrameTime: number;
  /** 更新时间（ms） */
  updateTime: number;
  /** 渲染时间（ms） */
  renderTime: number;
  /** 总帧数 */
  totalFrames: number;
  /** 运行时间（秒） */
  uptime: number;
  /** 内存使用（MB） */
  memoryUsed?: number;
  /** 内存限制（MB） */
  memoryLimit?: number;
  /** Draw Call 数量 */
  drawCalls: number;
  /** 纹理数量 */
  textureCount: number;
  /** 粒子数量 */
  particleCount: number;
}

/** 性能警告级别 */
export type PerformanceWarningLevel = 'info' | 'warning' | 'critical';

/** 性能警告 */
export interface PerformanceWarning {
  /** 警告类型 */
  type: 'low_fps' | 'high_frame_time' | 'memory_high' | 'memory_critical' | 'gc_stall' | 'long_frame';
  /** 警告级别 */
  level: PerformanceWarningLevel;
  /** 警告消息 */
  message: string;
  /** 当前值 */
  currentValue: number;
  /** 阈值 */
  threshold: number;
  /** 时间戳 */
  timestamp: number;
}

/** 性能配置 */
export interface PerformanceConfig {
  /** FPS 采样间隔（毫秒） */
  fpsSampleInterval: number;
  /** FPS 统计窗口（秒） */
  fpsStatsWindow: number;
  /** 低 FPS 阈值 */
  lowFpsThreshold: number;
  /** 高帧时间阈值（ms） */
  highFrameTimeThreshold: number;
  /** 内存警告阈值（百分比） */
  memoryWarningThreshold: number;
  /** 内存严重阈值（百分比） */
  memoryCriticalThreshold: number;
  /** 是否启用自动采集 */
  autoCollect: boolean;
  /** 采集间隔（毫秒） */
  collectInterval: number;
}

const DEFAULT_CONFIG: PerformanceConfig = {
  fpsSampleInterval: 500,
  fpsStatsWindow: 5,
  lowFpsThreshold: 30,
  highFrameTimeThreshold: 33,
  memoryWarningThreshold: 0.7,
  memoryCriticalThreshold: 0.9,
  autoCollect: true,
  collectInterval: 1000,
};

/**
 * 性能监控器
 * 
 * 使用示例：
 *   const perf = new PerformanceMonitor();
 *   perf.start();
 *   
 *   // 游戏循环
 *   function gameLoop() {
 *     perf.beginFrame();
 *     // ... 游戏逻辑
 *     perf.endFrame();
 *   }
 *   
 *   // 监听警告
 *   perf.onWarning((warning) => {
 *     console.warn(warning.message);
 *   });
 *   
 *   // 获取指标
 *   const metrics = perf.getMetrics();
 *   console.log(`FPS: ${metrics.fps}, 内存: ${metrics.memoryUsed}MB`);
 */
export class PerformanceMonitor extends EventEmitter {
  private config: PerformanceConfig;
  private fpsHistory: number[] = [];
  private frameTimes: number[] = [];
  private frameTimeIndex = 0;
  private maxFrameTimeSamples = 60;

  private frameCount = 0;
  private totalFrames = 0;
  private lastFpsTime = 0;
  private frameStartTime = 0;
  private updateStartTime = 0;
  private updateEndTime = 0;
  private renderEndTime = 0;

  private currentFps = 0;
  private avgFps = 0;
  private minFps = Infinity;
  private maxFps = 0;
  private avgFrameTime = 0;

  private running = false;
  private startTime = 0;
  private statsTimer: ReturnType<typeof setInterval> | null = null;

  // 统计数据
  private drawCalls = 0;
  private textureCount = 0;
  private particleCount = 0;

  constructor(config?: Partial<PerformanceConfig>) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.frameTimes = new Array(this.maxFrameTimeSamples).fill(0);
  }

  /** 开始监控 */
  start(): void {
    this.running = true;
    this.startTime = performance.now();
    this.lastFpsTime = this.startTime;

    if (this.config.autoCollect) {
      this.statsTimer = setInterval(() => this.collectStats(), this.config.collectInterval);
    }
  }

  /** 停止监控 */
  stop(): void {
    this.running = false;
    if (this.statsTimer) {
      clearInterval(this.statsTimer);
      this.statsTimer = null;
    }
  }

  /** 帧开始（在游戏循环开始时调用） */
  beginFrame(): void {
    this.frameStartTime = performance.now();
    this.drawCalls = 0;
  }

  /** 更新开始（在更新逻辑开始时调用） */
  beginUpdate(): void {
    this.updateStartTime = performance.now();
  }

  /** 更新结束（在更新逻辑结束时调用） */
  endUpdate(): void {
    this.updateEndTime = performance.now();
  }

  /** 渲染开始（在渲染开始时调用） */
  beginRender(): void {
    // 可选
  }

  /** 渲染结束（在渲染结束时调用） */
  endRender(): void {
    this.renderEndTime = performance.now();
  }

  /** 帧结束（在游戏循环结束时调用） */
  endFrame(): void {
    const now = performance.now();
    const frameTime = now - this.frameStartTime;

    // 记录帧时间
    this.frameTimes[this.frameTimeIndex] = frameTime;
    this.frameTimeIndex = (this.frameTimeIndex + 1) % this.maxFrameTimeSamples;

    // 更新帧计数
    this.frameCount++;
    this.totalFrames++;

    // 更新 FPS
    const fpsInterval = now - this.lastFpsTime;
    if (fpsInterval >= this.config.fpsSampleInterval) {
      this.currentFps = Math.round((this.frameCount * 1000) / fpsInterval);
      this.fpsHistory.push(this.currentFps);

      // 保持历史记录大小
      const maxHistory = Math.ceil(this.config.fpsStatsWindow * 1000 / this.config.fpsSampleInterval);
      if (this.fpsHistory.length > maxHistory) {
        this.fpsHistory.shift();
      }

      // 计算平均/最小/最大 FPS
      this.avgFps = Math.round(this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length);
      this.minFps = Math.min(this.minFps, this.currentFps);
      this.maxFps = Math.max(this.maxFps, this.currentFps);

      // 计算平均帧时间
      this.avgFrameTime = frameTime;

      // 检查性能警告
      this.checkWarnings();

      this.frameCount = 0;
      this.lastFpsTime = now;
    }
  }

  /** 记录 Draw Call */
  addDrawCall(count = 1): void {
    this.drawCalls += count;
  }

  /** 设置纹理数量 */
  setTextureCount(count: number): void {
    this.textureCount = count;
  }

  /** 设置粒子数量 */
  setParticleCount(count: number): void {
    this.particleCount = count;
  }

  /** 获取当前指标 */
  getMetrics(): PerformanceMetrics {
    const uptime = (performance.now() - this.startTime) / 1000;
    const memory = this.getMemoryInfo();

    return {
      fps: this.currentFps,
      avgFps: this.avgFps,
      minFps: this.minFps === Infinity ? 0 : this.minFps,
      maxFps: this.maxFps,
      frameTime: this.frameTimes[(this.frameTimeIndex - 1 + this.maxFrameTimeSamples) % this.maxFrameTimeSamples],
      avgFrameTime: this.avgFrameTime,
      updateTime: this.updateEndTime - this.updateStartTime,
      renderTime: this.renderEndTime - this.updateEndTime,
      totalFrames: this.totalFrames,
      uptime,
      memoryUsed: memory.used,
      memoryLimit: memory.limit,
      drawCalls: this.drawCalls,
      textureCount: this.textureCount,
      particleCount: this.particleCount,
    };
  }

  /** 获取 FPS */
  getFps(): number {
    return this.currentFps;
  }

  /** 获取平均 FPS */
  getAvgFps(): number {
    return this.avgFps;
  }

  /** 获取内存信息 */
  private getMemoryInfo(): { used?: number; limit?: number } {
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
        limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024),
      };
    }
    // 小程序环境
    if (typeof wx !== 'undefined' && wx.getSystemInfoSync) {
      try {
        const info = wx.getSystemInfoSync();
        return {
          used: (info as any).currentMemoryUsage ? Math.round((info as any).currentMemoryUsage) : undefined,
          limit: (info as any).memoryLimit ? Math.round((info as any).memoryLimit) : undefined,
        };
      } catch { /* ignore platform errors */ }
    }
    return {};
  }

  /** 检查性能警告 */
  private checkWarnings(): void {
    // 低 FPS 警告
    if (this.currentFps < this.config.lowFpsThreshold) {
      this.emitWarning({
        type: 'low_fps',
        level: this.currentFps < this.config.lowFpsThreshold / 2 ? 'critical' : 'warning',
        message: `FPS 过低: ${this.currentFps}`,
        currentValue: this.currentFps,
        threshold: this.config.lowFpsThreshold,
        timestamp: Date.now(),
      });
    }

    // 高帧时间警告
    if (this.avgFrameTime > this.config.highFrameTimeThreshold) {
      this.emitWarning({
        type: 'high_frame_time',
        level: 'warning',
        message: `帧时间过长: ${this.avgFrameTime.toFixed(1)}ms`,
        currentValue: this.avgFrameTime,
        threshold: this.config.highFrameTimeThreshold,
        timestamp: Date.now(),
      });
    }

    // 内存警告
    const memory = this.getMemoryInfo();
    if (memory.used && memory.limit) {
      const usage = memory.used / memory.limit;
      if (usage >= this.config.memoryCriticalThreshold) {
        this.emitWarning({
          type: 'memory_critical',
          level: 'critical',
          message: `内存严重不足: ${memory.used}MB / ${memory.limit}MB`,
          currentValue: usage,
          threshold: this.config.memoryCriticalThreshold,
          timestamp: Date.now(),
        });
      } else if (usage >= this.config.memoryWarningThreshold) {
        this.emitWarning({
          type: 'memory_high',
          level: 'warning',
          message: `内存使用较高: ${memory.used}MB / ${memory.limit}MB`,
          currentValue: usage,
          threshold: this.config.memoryWarningThreshold,
          timestamp: Date.now(),
        });
      }
    }
  }

  /** 发送警告 */
  private emitWarning(warning: PerformanceWarning): void {
    this.emit('performance:warning', warning);
    this.emit('performance:warning:' + warning.type, warning);
  }

  /** 采集统计数据 */
  private collectStats(): void {
    if (!this.running) return;
    this.emit('performance:stats', this.getMetrics());
  }

  /** 监听性能警告 */
  onWarning(callback: (warning: PerformanceWarning) => void): () => void {
    this.on('performance:warning', callback as any);
    return () => this.off('performance:warning', callback as any);
  }

  /** 监听 FPS 警告 */
  onLowFps(callback: (fps: number) => void): () => void {
    this.on('performance:warning:low_fps', (w: any) => callback(w.currentValue));
    return () => this.off('performance:warning:low_fps', callback as any);
  }

  /** 监听内存警告 */
  onMemoryWarning(callback: (level: PerformanceWarningLevel) => void): () => void {
    this.on('performance:warning:memory_high', () => callback('warning'));
    this.on('performance:warning:memory_critical', () => callback('critical'));
    return () => {
      this.off('performance:warning:memory_high', callback as any);
      this.off('performance:warning:memory_critical', callback as any);
    };
  }

  /** 监听统计数据采集 */
  onStats(callback: (metrics: PerformanceMetrics) => void): () => void {
    this.on('performance:stats', callback as any);
    return () => this.off('performance:stats', callback as any);
  }

  /** 重置统计 */
  reset(): void {
    this.fpsHistory.length = 0;
    this.frameTimes.fill(0);
    this.frameTimeIndex = 0;
    this.frameCount = 0;
    this.totalFrames = 0;
    this.currentFps = 0;
    this.avgFps = 0;
    this.minFps = Infinity;
    this.maxFps = 0;
    this.avgFrameTime = 0;
    this.startTime = performance.now();
    this.lastFpsTime = this.startTime;
  }
}

/**
 * 性能 Profiler：测量代码执行时间
 */
export class Profiler {
  private marks = new Map<string, number>();
  private results = new Map<string, number[]>();

  /** 开始计时 */
  start(name: string): void {
    this.marks.set(name, performance.now());
  }

  /** 结束计时 */
  end(name: string): number {
    const start = this.marks.get(name);
    if (start === undefined) return 0;

    const duration = performance.now() - start;
    this.marks.delete(name);

    if (!this.results.has(name)) {
      this.results.set(name, []);
    }
    this.results.get(name)!.push(duration);

    return duration;
  }

  /** 获取平均耗时 */
  getAverage(name: string): number {
    const samples = this.results.get(name);
    if (!samples || samples.length === 0) return 0;
    return samples.reduce((a, b) => a + b, 0) / samples.length;
  }

  /** 获取最大耗时 */
  getMax(name: string): number {
    const samples = this.results.get(name);
    if (!samples || samples.length === 0) return 0;
    return Math.max(...samples);
  }

  /** 获取最小耗时 */
  getMin(name: string): number {
    const samples = this.results.get(name);
    if (!samples || samples.length === 0) return 0;
    return Math.min(...samples);
  }

  /** 获取所有结果 */
  getAll(): Map<string, { avg: number; min: number; max: number; count: number }> {
    const result = new Map();
    for (const [name, samples] of this.results) {
      result.set(name, {
        avg: samples.reduce((a, b) => a + b, 0) / samples.length,
        min: Math.min(...samples),
        max: Math.max(...samples),
        count: samples.length,
      });
    }
    return result;
  }

  /** 重置 */
  reset(): void {
    this.marks.clear();
    this.results.clear();
  }
}

// ========== 便捷性能监控 ==========

/** 创建 FPS 监控器（简化版） */
export function createFpsMonitor(): PerformanceMonitor {
  return new PerformanceMonitor({
    fpsSampleInterval: 500,
    lowFpsThreshold: 30,
    autoCollect: false,
  });
}

/** 创建内存监控器 */
export function createMemoryMonitor(interval = 5000): PerformanceMonitor {
  return new PerformanceMonitor({
    autoCollect: true,
    collectInterval: interval,
  });
}
