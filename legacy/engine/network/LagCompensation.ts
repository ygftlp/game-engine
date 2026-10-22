// 网络延迟补偿：客户端预测 + 服务器回滚 + 插值缓冲 + 抖动缓冲。

/** 网络状态 */
export interface NetworkState {
  /** 往返延迟（毫秒） */
  rtt: number;
  /** 延迟抖动（毫秒） */
  jitter: number;
  /** 丢包率 0-1 */
  packetLoss: number;
  /** 服务器时间戳 */
  serverTime: number;
  /** 客户端时间戳 */
  clientTime: number;
}

/** 输入记录 */
export interface InputRecord {
  tick: number;
  sequence: number;
  playerId: string;
  actions: Record<string, unknown>;
  /** 客户端发送时间 */
  sendTime: number;
  /** 服务器确认时间 */
  ackTime?: number;
}

/** 快照记录 */
export interface SnapshotRecord {
  tick: number;
  timestamp: number;
  state: Record<string, Record<string, unknown>>;
  /** 快照中的输入（服务器已确认的） */
  confirmedInputs: InputRecord[];
}

/**
 * 网络延迟补偿器：管理客户端预测和服务器回滚。
 */
export class LagCompensator {
  private inputHistory: InputRecord[] = [];
  private snapshotHistory: SnapshotRecord[] = [];
  private maxInputHistory = 300;
  private maxSnapshotHistory = 300;

  private rtt = 0;
  private jitter = 0;
  private lastRttSamples: number[] = [];
  private maxRttSamples = 20;

  /** 记录发送的输入 */
  recordInput(input: InputRecord): void {
    this.inputHistory.push(input);
    if (this.inputHistory.length > this.maxInputHistory) {
      this.inputHistory.shift();
    }
  }

  /** 记录服务器快照 */
  recordSnapshot(snapshot: SnapshotRecord): void {
    this.snapshotHistory.push(snapshot);
    if (this.snapshotHistory.length > this.maxSnapshotHistory) {
      this.snapshotHistory.shift();
    }
  }

  /** 处理服务器确认 */
  handleAck(confirmedTick: number, serverTimestamp: number): void {
    for (const input of this.inputHistory) {
      if (input.tick <= confirmedTick && !input.ackTime) {
        input.ackTime = serverTimestamp;
      }
    }
  }

  /** 更新 RTT 估算 */
  updateRTT(sampleRtt: number): void {
    this.lastRttSamples.push(sampleRtt);
    if (this.lastRttSamples.length > this.maxRttSamples) {
      this.lastRttSamples.shift();
    }

    // 加权平均
    this.rtt = 0;
    for (let i = 0; i < this.lastRttSamples.length; i++) {
      const weight = (i + 1) / this.lastRttSamples.length;
      this.rtt += this.lastRttSamples[i] * weight;
    }
    this.rtt /= this.lastRttSamples.length;

    // 计算抖动
    if (this.lastRttSamples.length > 1) {
      const mean = this.rtt;
      let variance = 0;
      for (const sample of this.lastRttSamples) {
        variance += (sample - mean) * (sample - mean);
      }
      this.jitter = Math.sqrt(variance / this.lastRttSamples.length);
    }
  }

  /** 获取预测延迟（tick 数） */
  getPredictionDelay(tickRate: number): number {
    return Math.ceil(this.rtt / (1000 / tickRate) / 2);
  }

  /** 获取插值延迟（tick 数） */
  getInterpolationDelay(tickRate: number): number {
    return Math.max(1, Math.ceil(this.jitter / (1000 / tickRate)));
  }

  /** 获取未确认的输入 */
  getPendingInputs(): InputRecord[] {
    return this.inputHistory.filter(i => !i.ackTime);
  }

  /** 获取指定 tick 范围内的输入 */
  getInputsInRange(startTick: number, endTick: number): InputRecord[] {
    return this.inputHistory.filter(i => i.tick >= startTick && i.tick <= endTick);
  }

  /** 获取当前网络状态 */
  getState(): NetworkState {
    return {
      rtt: this.rtt,
      jitter: this.jitter,
      packetLoss: 0,
      serverTime: Date.now(),
      clientTime: Date.now(),
    };
  }

  /** 清理过期数据 */
  cleanup(currentTick: number): void {
    const keepThreshold = currentTick - 300;
    this.inputHistory = this.inputHistory.filter(i => i.tick > keepThreshold);
    this.snapshotHistory = this.snapshotHistory.filter(s => s.tick > keepThreshold);
  }
}

/**
 * 插值缓冲器：平滑网络状态更新。
 */
export class InterpolationBuffer<T> {
  private buffer: Array<{ timestamp: number; value: T }> = [];
  private maxBufferSize: number;
  private interpolationDelay: number;

  constructor(maxBufferSize = 60, interpolationDelay = 100) {
    this.maxBufferSize = maxBufferSize;
    this.interpolationDelay = interpolationDelay;
  }

  /** 添加状态 */
  add(timestamp: number, value: T): void {
    this.buffer.push({ timestamp, value });
    if (this.buffer.length > this.maxBufferSize) {
      this.buffer.shift();
    }
  }

  /** 获取插值后的值 */
  get(timestamp: number): T | null {
    if (this.buffer.length < 2) {
      return this.buffer.length > 0 ? this.buffer[0].value : null;
    }

    const targetTime = timestamp - this.interpolationDelay;

    // 找到目标时间前后的两个值
    let prev = this.buffer[0];
    let next = this.buffer[1];

    for (let i = 0; i < this.buffer.length - 1; i++) {
      if (this.buffer[i].timestamp <= targetTime && this.buffer[i + 1].timestamp >= targetTime) {
        prev = this.buffer[i];
        next = this.buffer[i + 1];
        break;
      }
    }

    // 如果目标时间在最后两个值之后，用最后一个
    if (targetTime >= this.buffer[this.buffer.length - 1].timestamp) {
      return this.buffer[this.buffer.length - 1].value;
    }

    // 线性插值
    const t = (targetTime - prev.timestamp) / (next.timestamp - prev.timestamp || 1);
    return this.interpolate(prev.value, next.value, Math.max(0, Math.min(1, t)));
  }

  /** 清空缓冲 */
  clear(): void {
    this.buffer.length = 0;
  }

  /** 缓冲区大小 */
  get size(): number {
    return this.buffer.length;
  }

  private interpolate(a: T, b: T, t: number): T {
    // 如果是数字类型，直接插值
    if (typeof a === 'number' && typeof b === 'number') {
      return (a + (b - a) * t) as unknown as T;
    }

    // 如果是对象类型，逐属性插值
    if (typeof a === 'object' && typeof b === 'object' && a !== null && b !== null) {
      const result: any = Array.isArray(a) ? [] : {};
      for (const key of Object.keys(a as any)) {
        const va = (a as any)[key];
        const vb = (b as any)[key];
        if (typeof va === 'number' && typeof vb === 'number') {
          result[key] = va + (vb - va) * t;
        } else {
          result[key] = t < 0.5 ? va : vb;
        }
      }
      return result;
    }

    return t < 0.5 ? a : b;
  }
}

/**
 * 抖动缓冲器：吸收网络延迟波动，提供稳定的输入流。
 */
export class JitterBuffer<T> {
  private buffer: Array<{ timestamp: number; value: T }> = [];
  private targetDelay: number;
  private maxBufferSize: number;

  constructor(targetDelay = 2, maxBufferSize = 60) {
    this.targetDelay = targetDelay;
    this.maxBufferSize = maxBufferSize;
  }

  /** 添加数据 */
  push(timestamp: number, value: T): void {
    this.buffer.push({ timestamp, value });
    this.buffer.sort((a, b) => a.timestamp - b.timestamp);

    // 限制缓冲区大小
    while (this.buffer.length > this.maxBufferSize) {
      this.buffer.shift();
    }
  }

  /** 获取下一个可消费的数据 */
  pop(): T | null {
    if (this.buffer.length <= this.targetDelay) {
      return null;
    }
    const item = this.buffer.shift();
    return item?.value ?? null;
  }

  /** 查看但不消费 */
  peek(): T | null {
    return this.buffer.length > 0 ? this.buffer[0].value : null;
  }

  /** 获取缓冲区大小 */
  get size(): number {
    return this.buffer.length;
  }

  /** 清空缓冲 */
  clear(): void {
    this.buffer.length = 0;
  }

  /** 是否有足够数据可消费 */
  hasData(): boolean {
    return this.buffer.length > this.targetDelay;
  }
}
