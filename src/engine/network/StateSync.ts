// 网络状态同步：确定性快照同步 + 插值 + 客户端预测 + 服务器回滚。
import { EventEmitter } from '../core/EventEmitter';
import { WebSocketClient } from './WebSocket';

/** 同步对象接口 */
export interface SyncObject {
  id: string;
  /** 序列化为快照 */
  serialize(): Record<string, unknown>;
  /** 从快照恢复 */
  deserialize(snapshot: Record<string, unknown>): void;
  /** 本地预测（输入驱动） */
  applyInput(input: PlayerInput): void;
}

/** 玩家输入 */
export interface PlayerInput {
  playerId: string;
  tick: number;
  sequence: number;
  actions: Record<string, unknown>;
}

/** 状态快照 */
export interface StateSnapshot {
  tick: number;
  timestamp: number;
  objects: Record<string, Record<string, unknown>>;
  inputs: PlayerInput[];
}

/** 同步配置 */
export interface SyncConfig {
  /** 服务器 tick 间隔（毫秒） */
  tickRate: number;
  /** 最大快照历史长度 */
  maxSnapshotHistory: number;
  /** 插值延迟（tick 数） */
  interpolationDelay: number;
  /** 最大预测帧数 */
  maxPredictionFrames: number;
}

/**
 * 状态同步器：管理客户端-服务器状态同步。
 *
 * 使用示例：
 *   const sync = new StateSyncManager(client, { tickRate: 20 });
 *   sync.registerObject('player1', playerSprite);
 *   sync.on('stateUpdate', (snapshots) => renderInterpolated(snapshots));
 *   // 每帧发送输入
 *   sync.sendInput({ playerId: 'p1', tick: currentTick, actions: { moveX: 1 } });
 */
export class StateSyncManager extends EventEmitter {
  private client: WebSocketClient;
  private config: SyncConfig;
  private objects = new Map<string, SyncObject>();
  private snapshots: StateSnapshot[] = [];
  private localTick = 0;
  private serverTick = 0;
  private lastSnapshotTime = 0;
  private rtt = 0;
  private sequence = 0;
  private pendingInputs: PlayerInput[] = [];
  private playerId = '';

  constructor(client: WebSocketClient, config?: Partial<SyncConfig>) {
    super();
    this.client = client;
    this.config = {
      tickRate: config?.tickRate ?? 20,
      maxSnapshotHistory: config?.maxSnapshotHistory ?? 300,
      interpolationDelay: config?.interpolationDelay ?? 2,
      maxPredictionFrames: config?.maxPredictionFrames ?? 10,
    };

    this.setupNetworkHandlers();
  }

  /** 设置玩家 ID */
  setPlayerId(id: string): void {
    this.playerId = id;
  }

  /** 注册可同步对象 */
  registerObject(id: string, obj: SyncObject): void {
    this.objects.set(id, obj);
  }

  /** 注销同步对象 */
  unregisterObject(id: string): void {
    this.objects.delete(id);
  }

  /** 发送玩家输入 */
  sendInput(actions: Record<string, unknown>): void {
    this.sequence++;
    const input: PlayerInput = {
      playerId: this.playerId,
      tick: this.localTick,
      sequence: this.sequence,
      actions,
    };

    this.pendingInputs.push(input);
    this.localTick++;

    // 发送到服务器
    this.client.send({ type: 'input', data: input });

    // 本地预测
    const obj = this.objects.get(this.playerId);
    if (obj) {
      obj.applyInput(input);
    }
  }

  /** 获取插值状态（用于渲染） */
  getInterpolationState(): Record<string, Record<string, unknown>> | null {
    if (this.snapshots.length < 2) return null;

    const renderTime = this.serverTick - this.config.interpolationDelay;

    // 找到渲染时间前后的两个快照
    let prev: StateSnapshot | null = null;
    let next: StateSnapshot | null = null;

    for (let i = 0; i < this.snapshots.length - 1; i++) {
      if (this.snapshots[i].tick <= renderTime && this.snapshots[i + 1].tick >= renderTime) {
        prev = this.snapshots[i];
        next = this.snapshots[i + 1];
        break;
      }
    }

    if (!prev || !next) {
      // 用最新快照
      const latest = this.snapshots[this.snapshots.length - 1];
      return latest.objects;
    }

    // 插值
    const t = (renderTime - prev.tick) / (next.tick - prev.tick);
    const result: Record<string, Record<string, unknown>> = {};

    for (const id of Object.keys(prev.objects)) {
      if (next.objects[id]) {
        result[id] = this.interpolateObjects(prev.objects[id], next.objects[id], t);
      } else {
        result[id] = prev.objects[id];
      }
    }

    return result;
  }

  /** 获取当前 RTT（毫秒） */
  getRTT(): number {
    return this.rtt;
  }

  /** 获取服务器 tick */
  getServerTick(): number {
    return this.serverTick;
  }

  /** 获取本地 tick */
  getLocalTick(): number {
    return this.localTick;
  }

  /** 清除快照历史 */
  clearHistory(): void {
    this.snapshots.length = 0;
    this.pendingInputs.length = 0;
  }

  private setupNetworkHandlers(): void {
    this.client.on('message', (msg: any) => {
      if (msg.type === 'state') {
        this.handleServerState(msg.data);
      } else if (msg.type === 'input_ack') {
        this.handleInputAck(msg.data);
      } else if (msg.type === 'pong') {
        this.handlePong(msg.data);
      }
    });

    this.client.on('open', () => {
      this.emit('connected');
    });

    this.client.on('close', () => {
      this.emit('disconnected');
    });
  }

  private handleServerState(data: { tick: number; objects: Record<string, Record<string, unknown>>; timestamp: number }): void {
    this.serverTick = data.tick;
    this.lastSnapshotTime = Date.now();

    const snapshot: StateSnapshot = {
      tick: data.tick,
      timestamp: data.timestamp,
      objects: data.objects,
      inputs: [],
    };

    this.snapshots.push(snapshot);

    // 限制快照历史长度
    while (this.snapshots.length > this.config.maxSnapshotHistory) {
      this.snapshots.shift();
    }

    // 应用服务器状态（非本地玩家）
    for (const [id, objData] of Object.entries(data.objects)) {
      if (id === this.playerId) continue;
      const obj = this.objects.get(id);
      if (obj) {
        obj.deserialize(objData);
      }
    }

    // 服务器确认后，移除已确认的输入
    const confirmedTick = data.tick;
    this.pendingInputs = this.pendingInputs.filter(input => input.tick > confirmedTick);

    // 重新应用未确认的输入（客户端预测修正）
    const localObj = this.objects.get(this.playerId);
    if (localObj && data.objects[this.playerId]) {
      localObj.deserialize(data.objects[this.playerId]);
      for (const input of this.pendingInputs) {
        localObj.applyInput(input);
      }
    }

    this.emit('stateUpdate', snapshot);
  }

  private handleInputAck(_data: { sequence: number; serverTick: number }): void {
    // 根据 RTT 估算
    const now = Date.now();
    this.rtt = now - this.lastSnapshotTime;
  }

  private handlePong(_data: any): void {
    // RTT 测量
  }

  private interpolateObjects(
    a: Record<string, unknown>,
    b: Record<string, unknown>,
    t: number
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    const clampedT = Math.max(0, Math.min(1, t));

    for (const key of Object.keys(a)) {
      const va = a[key];
      const vb = b[key];

      if (typeof va === 'number' && typeof vb === 'number') {
        result[key] = va + (vb - va) * clampedT;
      } else {
        result[key] = clampedT < 0.5 ? va : vb;
      }
    }

    return result;
  }
}

/**
 * 帧同步管理器：确定性锁步同步，适用于格斗/RTS 等需要完全同步的游戏。
 */
export class LockstepSync extends EventEmitter {
  private client: WebSocketClient;
  private localTick = 0;
  private confirmedTick = 0;
  private inputBuffer = new Map<number, PlayerInput[]>();
  private playerId = '';
  private _tickRate: number;
  private pendingInputs: PlayerInput[] = [];
  private sequence = 0;

  constructor(client: WebSocketClient, tickRate = 15) {
    super();
    this.client = client;
    this._tickRate = tickRate;
    this.setupHandlers();
  }

  /** 获取 tick 速率 */
  getTickRate(): number {
    return this._tickRate;
  }

  /** 设置玩家 ID */
  setPlayerId(id: string): void {
    this.playerId = id;
  }

  /** 发送输入 */
  sendInput(actions: Record<string, unknown>): void {
    this.sequence++;
    const input: PlayerInput = {
      playerId: this.playerId,
      tick: this.localTick,
      sequence: this.sequence,
      actions,
    };

    this.pendingInputs.push(input);
    this.client.send({ type: 'input', data: input });
  }

  /** 获取指定 tick 的所有玩家输入 */
  getInputsForTick(tick: number): PlayerInput[] {
    return this.inputBuffer.get(tick) ?? [];
  }

  /** 确认 tick 已执行 */
  confirmTick(tick: number): void {
    this.confirmedTick = tick;
    this.client.send({ type: 'tick_confirm', data: { tick } });
  }

  /** 获取已确认的 tick */
  getConfirmedTick(): number {
    return this.confirmedTick;
  }

  /** 是否可以执行下一个 tick（所有玩家输入就绪） */
  canAdvance(): boolean {
    return this.inputBuffer.has(this.localTick);
  }

  private setupHandlers(): void {
    this.client.on('message', (msg: any) => {
      if (msg.type === 'input') {
        const input = msg.data as PlayerInput;
        if (!this.inputBuffer.has(input.tick)) {
          this.inputBuffer.set(input.tick, []);
        }
        this.inputBuffer.get(input.tick)!.push(input);
        this.emit('inputReceived', input);
      } else if (msg.type === 'sync_state') {
        this.handleSyncState(msg.data);
      }
    });
  }

  private handleSyncState(data: { tick: number; inputs: PlayerInput[] }): void {
    for (const input of data.inputs) {
      if (!this.inputBuffer.has(input.tick)) {
        this.inputBuffer.set(input.tick, []);
      }
      this.inputBuffer.get(input.tick)!.push(input);
    }
    this.emit('syncUpdate', data);
  }
}
