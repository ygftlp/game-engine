// 3D 空间音效：支持位置音频、距离衰减、多普勒效应、环境混响。
import { IAudio } from '../platform/Platform';
import { Vec3 } from '../math/Mat4';

/** 空间音效配置 */
export interface SpatialAudioConfig {
  /** 最大听距 */
  maxDistance: number;
  /** 参考距离（音量为1的距离） */
  referenceDistance: number;
  /** 衰减模型 */
  rolloff: 'linear' | 'inverse' | 'exponential';
  /** 是否启用多普勒效应 */
  dopplerFactor: number;
  /** 环境混响强度 0-1 */
  reverb: number;
}

const DEFAULT_SPATIAL_CONFIG: SpatialAudioConfig = {
  maxDistance: 500,
  referenceDistance: 50,
  rolloff: 'inverse',
  dopplerFactor: 1,
  reverb: 0,
};

/**
 * 空间音频源：挂在世界坐标系中的音频源。
 */
export class SpatialAudioSource {
  position: Vec3 = new Vec3();
  velocity: Vec3 = new Vec3();
  config: SpatialAudioConfig;

  private audio: IAudio;
  private _playing = false;

  constructor(audio: IAudio, config?: Partial<SpatialAudioConfig>) {
    this.audio = audio;
    this.config = { ...DEFAULT_SPATIAL_CONFIG, ...config };
  }

  /** 播放 */
  play(loop = false): void {
    this.audio.loop = loop;
    this.audio.play();
    this._playing = true;
  }

  /** 暂停 */
  pause(): void {
    this.audio.pause();
    this._playing = false;
  }

  /** 停止 */
  stop(): void {
    this.audio.stop();
    this._playing = false;
  }

  /** 是否正在播放 */
  isPlaying(): boolean {
    return this._playing;
  }

  /** 更新音量（由 SpatialAudioListener 调用） */
  updateVolume(listenerPos: Vec3, listenerVel: Vec3): void {
    if (!this._playing) return;

    const dx = this.position.x - listenerPos.x;
    const dy = this.position.y - listenerPos.y;
    const dz = this.position.z - listenerPos.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    // 距离衰减
    const volume = this.calculateAttenuation(distance);

    // 多普勒效应
    if (this.config.dopplerFactor > 0) {
      const doppler = this.calculateDoppler(listenerPos, listenerVel);
      this.audio.volume = volume * doppler;
    } else {
      this.audio.volume = volume;
    }
  }

  /** 计算距离衰减 */
  private calculateAttenuation(distance: number): number {
    const { maxDistance, referenceDistance, rolloff } = this.config;

    if (distance <= referenceDistance) return 1;
    if (distance >= maxDistance) return 0;

    switch (rolloff) {
      case 'linear':
        return 1 - (distance - referenceDistance) / (maxDistance - referenceDistance);
      case 'inverse': {
        const rolloffFactor = 1;
        return referenceDistance / (referenceDistance + rolloffFactor * (distance - referenceDistance));
      }
      case 'exponential': {
        const rolloffFactor = 1;
        return Math.pow(distance / referenceDistance, -rolloffFactor);
      }
      default: {
        const d = distance / referenceDistance;
        return 1 / d;
      }
    }
  }

  /** 计算多普勒频移 */
  private calculateDoppler(listenerPos: Vec3, listenerVel: Vec3): number {
    const dx = this.position.x - listenerPos.x;
    const dy = this.position.y - listenerPos.y;
    const dz = this.position.z - listenerPos.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (dist < 0.001) return 1;

    // 源相对听者的速度
    const relativeVelX = this.velocity.x - listenerVel.x;
    const relativeVelY = this.velocity.y - listenerVel.y;
    const relativeVelZ = this.velocity.z - listenerVel.z;

    const sourceSpeed = (relativeVelX * dx + relativeVelY * dy + relativeVelZ * dz) / dist;
    const listenerSpeed = 0; // 简化：听者静止

    const speedOfSound = 343;
    const factor = this.config.dopplerFactor;

    const denominator = speedOfSound - factor * listenerSpeed;
    const numerator = speedOfSound + factor * sourceSpeed;

    return Math.max(0.1, Math.min(2, numerator / denominator));
  }
}

/**
 * 空间音频监听器：跟随相机或玩家。
 */
export class SpatialAudioListener {
  position: Vec3 = new Vec3();
  velocity: Vec3 = new Vec3();
  /** 前方向 */
  forward: Vec3 = new Vec3(0, 0, -1);
  /** 上方向 */
  up: Vec3 = new Vec3(0, 1, 0);

  private sources = new Set<SpatialAudioSource>();

  /** 注册音频源 */
  addSource(source: SpatialAudioSource): void {
    this.sources.add(source);
  }

  /** 注销音频源 */
  removeSource(source: SpatialAudioSource): void {
    this.sources.delete(source);
  }

  /** 更新所有音频源的音量（每帧调用） */
  update(dt: number): void {
    // 更新速度（用于多普勒）
    void dt;
    for (const source of this.sources) {
      source.updateVolume(this.position, this.velocity);
    }
  }

  /** 设置位置 */
  setPosition(x: number, y: number, z: number): void {
    this.position.set(x, y, z);
  }

  /** 设置朝向 */
  setOrientation(forwardX: number, forwardY: number, forwardZ: number): void {
    this.forward.set(forwardX, forwardY, forwardZ);
  }
}

/**
 * 环境混响：模拟不同空间的声学特性。
 */
export class ReverbEffect {
  /** 混响时间（秒） */
  decayTime = 1;
  /** 预延迟（毫秒） */
  preDelay = 20;
  /** 湿信号比例 0-1 */
  wetRatio = 0.3;
  /** 干信号比例 0-1 */
  dryRatio = 0.7;
  /** 高频阻尼 */
  highDamping = 0.5;

  /** 预设：大厅 */
  static hall(): ReverbEffect {
    const r = new ReverbEffect();
    r.decayTime = 2.5;
    r.preDelay = 30;
    r.wetRatio = 0.4;
    return r;
  }

  /** 预设：小房间 */
  static smallRoom(): ReverbEffect {
    const r = new ReverbEffect();
    r.decayTime = 0.8;
    r.preDelay = 10;
    r.wetRatio = 0.2;
    return r;
  }

  /** 预设：洞穴 */
  static cave(): ReverbEffect {
    const r = new ReverbEffect();
    r.decayTime = 4;
    r.preDelay = 50;
    r.wetRatio = 0.5;
    r.highDamping = 0.3;
    return r;
  }

  /** 预设：户外（无混响） */
  static outdoor(): ReverbEffect {
    const r = new ReverbEffect();
    r.decayTime = 0.1;
    r.wetRatio = 0;
    return r;
  }
}
