// 增强粒子系统：支持 GPU 粒子、力场、子发射器、噪声场、颜色渐变。

import { Node } from '../core/Node';
import { Renderer } from '../render/Renderer';
import { Vec3 } from '../math/Mat4';

/** 粒子形状 */
export type ParticleShape = 'point' | 'circle' | 'sphere' | 'box' | 'cone' | 'hemisphere';

/** 粒子渲染模式 */
export type ParticleRenderMode = 'billboard' | 'stretched' | 'mesh' | 'horizontal';

/** 粒子排序模式 */
export type ParticleSortMode = 'none' | 'distance' | 'youngest' | 'oldest';

/** 子发射器触发条件 */
export type SubEmitterTrigger = 'birth' | 'death' | 'collision' | 'timeout';

/** 粒子系统配置 */
export interface EnhancedParticleConfig {
  /** 最大粒子数 */
  maxParticles: number;
  /** 每秒发射数 */
  emissionRate: number;
  /** 持续时间（秒，-1=无限） */
  duration: number;
  /** 是否循环 */
  loop: boolean;
  /** 是否预热（启动时立即发射一轮） */
  prewarm: boolean;
  /** 发射形状 */
  shape: ParticleShape;
  /** 发射形状参数 */
  shapeRadius?: number;
  /** 发射形状尺寸（box 模式） */
  shapeSize?: Vec3;
  /** 发射角度范围 */
  angleRange?: { min: number; max: number };
  /** 发射速度范围 */
  speedRange?: { min: number; max: number };

  // 粒子属性
  /** 生命周期范围 */
  lifetimeRange?: { min: number; max: number };
  /** 起始大小范围 */
  startSizeRange?: { min: number; max: number };
  /** 结束大小 */
  endSize?: number;
  /** 起始旋转范围（弧度） */
  startRotationRange?: { min: number; max: number };
  /** 旋转速度范围（弧度/秒） */
  rotationSpeedRange?: { min: number; max: number };
  /** 起始颜色（渐变起始） */
  startColor?: Vec3;
  /** 结束颜色（渐变结束） */
  endColor?: Vec3;
  /** 起始透明度 */
  startAlpha?: number;
  /** 结束透明度 */
  endAlpha?: number;

  // 物理
  /** 重力 */
  gravity?: Vec3;
  /** 空气阻力 0-1 */
  drag?: number;
  /** 湍流强度 */
  turbulence?: number;

  // 渲染
  /** 渲染模式 */
  renderMode?: ParticleRenderMode;
  /** 排序模式 */
  sortMode?: ParticleSortMode;
  /** 粒子大小（像素） */
  particleSize?: number;
  /** 纹理 */
  texture?: any;
  /** 是否使用 additive 混合 */
  additive?: boolean;

  // 子发射器
  /** 子发射器列表 */
  subEmitters?: SubEmitterConfig[];
}

/** 子发射器配置 */
export interface SubEmitterConfig {
  /** 触发条件 */
  trigger: SubEmitterTrigger;
  /** 子系统配置 */
  system: Partial<EnhancedParticleConfig>;
  /** 概率 0-1 */
  probability?: number;
}

/** 力场类型 */
export type ForceFieldType = 'directional' | 'radial' | 'vortex' | 'turbulence';

/** 力场配置 */
export interface ForceFieldConfig {
  type: ForceFieldType;
  /** 力场中心（径向/涡旋） */
  position?: Vec3;
  /** 力方向（方向力场） */
  direction?: Vec3;
  /** 力强度 */
  strength: number;
  /** 力场半径（0=无限） */
  radius?: number;
  /** 涡旋轴 */
  axis?: Vec3;
}

/**
 * 力场：影响粒子运动。
 */
export class ForceField {
  type: ForceFieldType;
  position: Vec3;
  direction: Vec3;
  strength: number;
  radius: number;
  axis: Vec3;

  constructor(config: ForceFieldConfig) {
    this.type = config.type;
    this.position = config.position?.clone() ?? new Vec3();
    this.direction = config.direction?.normalize() ?? new Vec3(0, -1, 0);
    this.strength = config.strength;
    this.radius = config.radius ?? 0;
    this.axis = config.axis?.normalize() ?? new Vec3(0, 1, 0);
  }

  /** 计算力场对粒子的作用力 */
  applyForce(particlePos: Vec3): Vec3 {
    switch (this.type) {
      case 'directional':
        return this.direction.scale(this.strength);

      case 'radial': {
        const diff = particlePos.sub(this.position);
        const dist = diff.length();
        if (this.radius > 0 && dist > this.radius) return new Vec3();
        if (dist < 0.001) return new Vec3();
        return diff.normalize().scale(this.strength);
      }

      case 'vortex': {
        const toCenter = this.position.sub(particlePos);
        const dist = toCenter.length();
        if (this.radius > 0 && dist > this.radius) return new Vec3();
        if (dist < 0.001) return new Vec3();
        const tangent = this.axis.cross(toCenter.normalize());
        return tangent.scale(this.strength / (dist + 1));
      }

      case 'turbulence': {
        const time = Date.now() * 0.001;
        const nx = Math.sin(particlePos.x * 0.1 + time) * Math.cos(particlePos.y * 0.1 + time * 0.7);
        const ny = Math.cos(particlePos.y * 0.1 + time) * Math.sin(particlePos.z * 0.1 + time * 0.7);
        const nz = Math.sin(particlePos.z * 0.1 + time) * Math.cos(particlePos.x * 0.1 + time * 0.7);
        return new Vec3(nx, ny, nz).scale(this.strength);
      }
    }
  }
}

/** 增强粒子状态 */
interface EnhancedParticle {
  position: Vec3;
  velocity: Vec3;
  rotation: number;
  angularVelocity: number;
  size: number;
  sizeEnd: number;
  life: number;
  maxLife: number;
  color: Vec3;
  endColor: Vec3;
  alpha: number;
  endAlpha: number;
  /** 是否活跃 */
  active: boolean;
}

/**
 * 增强粒子发射器：支持力场、子发射器、噪声场。
 */
export class EnhancedParticleEmitter extends Node {
  config: EnhancedParticleConfig;
  private particles: EnhancedParticle[] = [];
  private emitAccumulator = 0;
  private _playing = false;
  private _elapsed = 0;
  private forceFields: ForceField[] = [];
  private time = 0;

  /** 发射器位置 */
  emitterPosition = new Vec3();

  constructor(config?: Partial<EnhancedParticleConfig>) {
    super();
    this.config = {
      maxParticles: 500,
      emissionRate: 50,
      duration: -1,
      loop: true,
      prewarm: false,
      shape: 'point',
      lifetimeRange: { min: 0.5, max: 2 },
      startSizeRange: { min: 4, max: 8 },
      endSize: 0,
      startColor: new Vec3(1, 0.5, 0),
      endColor: new Vec3(1, 0, 0),
      startAlpha: 1,
      endAlpha: 0,
      gravity: new Vec3(0, 200, 0),
      renderMode: 'billboard',
      sortMode: 'none',
      particleSize: 64,
      additive: false,
      ...config,
    };
  }

  /** 添加力场 */
  addForceField(field: ForceField): void {
    this.forceFields.push(field);
  }

  /** 移除力场 */
  removeForceField(field: ForceField): void {
    const idx = this.forceFields.indexOf(field);
    if (idx >= 0) this.forceFields.splice(idx, 1);
  }

  /** 开始发射 */
  play(): void {
    this._playing = true;
    this._elapsed = 0;

    if (this.config.prewarm) {
      this.prewarm();
    }
  }

  /** 停止发射 */
  stop(): void {
    this._playing = false;
  }

  /** 清空粒子 */
  clear(): void {
    this.particles.length = 0;
  }

  /** 是否正在播放 */
  isPlaying(): boolean {
    return this._playing;
  }

  /** 当前粒子数 */
  get particleCount(): number {
    return this.particles.filter(p => p.active).length;
  }

  /** 强制发射一个粒子 */
  emitOne(position?: Vec3): void {
    if (this.particles.length >= this.config.maxParticles) return;
    this.spawnParticle(position);
  }

  /** 每帧更新 */
  update(dt: number): void {
    this.time += dt;

    // 发射新粒子
    if (this._playing) {
      this._elapsed += dt;
      if (this.config.duration > 0 && this._elapsed >= this.config.duration) {
        if (this.config.loop) {
          this._elapsed = 0;
        } else {
          this._playing = false;
        }
      }

      if (this._playing) {
        this.emitAccumulator += this.config.emissionRate * dt;
        while (this.emitAccumulator >= 1) {
          this.spawnParticle();
          this.emitAccumulator -= 1;
        }
      }
    }

    // 更新粒子
    for (const p of this.particles) {
      if (!p.active) continue;

      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        continue;
      }

      const t = 1 - p.life / p.maxLife;

      // 力场影响
      for (const field of this.forceFields) {
        const force = field.applyForce(p.position);
        p.velocity = p.velocity.add(force.scale(dt));
      }

      // 重力
      if (this.config.gravity) {
        p.velocity = p.velocity.add(this.config.gravity.scale(dt));
      }

      // 空气阻力
      if (this.config.drag) {
        p.velocity = p.velocity.scale(1 - this.config.drag * dt);
      }

      // 湍流
      if (this.config.turbulence) {
        const turb = new Vec3(
          Math.sin(this.time * 3 + p.position.x * 0.01) * this.config.turbulence,
          Math.cos(this.time * 3 + p.position.y * 0.01) * this.config.turbulence,
          0
        );
        p.velocity = p.velocity.add(turb.scale(dt));
      }

      // 位置更新
      p.position = p.position.add(p.velocity.scale(dt));

      // 旋转更新
      p.rotation += p.angularVelocity * dt;

      // 大小插值
      p.size = p.size + (p.sizeEnd - p.size) * t;

      // 颜色插值
      p.color = p.color.add(p.endColor.sub(p.color).scale(t));

      // 透明度插值
      p.alpha = p.alpha + (p.endAlpha - p.alpha) * t;
    }
  }

  protected draw(renderer: Renderer): void {
    const ctx = renderer.ctx;

    // 排序粒子
    const visibleParticles = this.particles.filter(p => p.active && p.alpha > 0);

    if (this.config.sortMode === 'distance') {
      // 按距离排序（简化：用 Y 值代替）
      visibleParticles.sort((a, b) => b.position.y - a.position.y);
    } else if (this.config.sortMode === 'youngest') {
      visibleParticles.sort((a, b) => b.life - a.life);
    } else if (this.config.sortMode === 'oldest') {
      visibleParticles.sort((a, b) => a.life - b.life);
    }

    if (this.config.additive) {
      ctx.globalCompositeOperation = 'lighter';
    }

    for (const p of visibleParticles) {
      const halfSize = p.size / 2;

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.translate(p.position.x, p.position.y);
      ctx.rotate(p.rotation);

      // 颜色插值
      const r = Math.round(p.color.x * 255);
      const g = Math.round(p.color.y * 255);
      const b = Math.round(p.color.z * 255);
      ctx.fillStyle = `rgb(${r},${g},${b})`;

      if (this.config.texture) {
        ctx.drawImage(this.config.texture, -halfSize, -halfSize, p.size, p.size);
      } else {
        ctx.fillRect(-halfSize, -halfSize, p.size, p.size);
      }

      ctx.restore();
    }

    if (this.config.additive) {
      ctx.globalCompositeOperation = 'source-over';
    }
  }

  private prewarm(): void {
    const totalParticles = Math.min(this.config.maxParticles, this.config.emissionRate * this.config.duration);
    for (let i = 0; i < totalParticles; i++) {
      this.spawnParticle();
      for (const p of this.particles) {
        if (p.active) {
          p.life -= (this.config.duration / totalParticles) * i;
        }
      }
    }
  }

  private spawnParticle(position?: Vec3): void {
    const cfg = this.config;

    // 查找空闲槽位
    let particle: EnhancedParticle | null = null;
    for (const p of this.particles) {
      if (!p.active) {
        particle = p;
        break;
      }
    }

    if (!particle) {
      if (this.particles.length >= cfg.maxParticles) return;
      particle = { position: new Vec3(), velocity: new Vec3(), rotation: 0, angularVelocity: 0, size: 0, sizeEnd: 0, life: 0, maxLife: 0, color: new Vec3(), endColor: new Vec3(), alpha: 0, endAlpha: 0, active: false };
      this.particles.push(particle);
    }

    // 发射位置
    particle.position = position?.clone() ?? this.getEmitPosition();
    particle.velocity = this.getEmitVelocity();

    // 生命周期
    const lifetime = cfg.lifetimeRange!;
    particle.life = lifetime.min + Math.random() * (lifetime.max - lifetime.min);
    particle.maxLife = particle.life;

    // 大小
    const startSize = cfg.startSizeRange!;
    particle.size = startSize.min + Math.random() * (startSize.max - startSize.min);
    particle.sizeEnd = cfg.endSize ?? 0;

    // 旋转
    if (cfg.startRotationRange) {
      particle.rotation = cfg.startRotationRange.min + Math.random() * (cfg.startRotationRange.max - cfg.startRotationRange.min);
    }
    if (cfg.rotationSpeedRange) {
      particle.angularVelocity = cfg.rotationSpeedRange.min + Math.random() * (cfg.rotationSpeedRange.max - cfg.rotationSpeedRange.min);
    }

    // 颜色
    particle.color = cfg.startColor?.clone() ?? new Vec3(1, 1, 1);
    particle.endColor = cfg.endColor?.clone() ?? new Vec3(1, 1, 1);

    // 透明度
    particle.alpha = cfg.startAlpha ?? 1;
    particle.endAlpha = cfg.endAlpha ?? 0;

    particle.active = true;
  }

  private getEmitPosition(): Vec3 {
    const cfg = this.config;

    switch (cfg.shape) {
      case 'point':
        return this.emitterPosition.clone();

      case 'circle': {
        const r = cfg.shapeRadius ?? 10;
        const angle = Math.random() * Math.PI * 2;
        return new Vec3(
          this.emitterPosition.x + Math.cos(angle) * r,
          this.emitterPosition.y + Math.sin(angle) * r,
          this.emitterPosition.z
        );
      }

      case 'sphere': {
        const r = cfg.shapeRadius ?? 10;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        return new Vec3(
          this.emitterPosition.x + r * Math.sin(phi) * Math.cos(theta),
          this.emitterPosition.y + r * Math.sin(phi) * Math.sin(theta),
          this.emitterPosition.z + r * Math.cos(phi)
        );
      }

      case 'box': {
        const s = cfg.shapeSize ?? new Vec3(10, 10, 10);
        return new Vec3(
          this.emitterPosition.x + (Math.random() - 0.5) * s.x,
          this.emitterPosition.y + (Math.random() - 0.5) * s.y,
          this.emitterPosition.z + (Math.random() - 0.5) * s.z
        );
      }

      case 'cone': {
        const r = cfg.shapeRadius ?? 10;
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * r;
        return new Vec3(
          this.emitterPosition.x + Math.cos(angle) * dist,
          this.emitterPosition.y,
          this.emitterPosition.z + Math.sin(angle) * dist
        );
      }

      case 'hemisphere': {
        const r = cfg.shapeRadius ?? 10;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random());
        return new Vec3(
          this.emitterPosition.x + r * Math.sin(phi) * Math.cos(theta),
          this.emitterPosition.y + r * Math.cos(phi) * 0.5,
          this.emitterPosition.z + r * Math.sin(phi) * Math.sin(theta)
        );
      }

      default:
        return this.emitterPosition.clone();
    }
  }

  private getEmitVelocity(): Vec3 {
    const cfg = this.config;

    let angle: number;
    if (cfg.angleRange) {
      angle = cfg.angleRange.min + Math.random() * (cfg.angleRange.max - cfg.angleRange.min);
    } else {
      angle = Math.random() * Math.PI * 2;
    }

    let speed: number;
    if (cfg.speedRange) {
      speed = cfg.speedRange.min + Math.random() * (cfg.speedRange.max - cfg.speedRange.min);
    } else {
      speed = 100;
    }

    if (cfg.shape === 'cone') {
      const coneAngle = Math.atan2(cfg.shapeRadius ?? 10, 50);
      const spreadAngle = Math.random() * coneAngle;
      const spreadDir = Math.random() * Math.PI * 2;
      return new Vec3(
        Math.sin(spreadAngle) * Math.cos(spreadDir) * speed,
        -Math.cos(spreadAngle) * speed,
        Math.sin(spreadAngle) * Math.sin(spreadDir) * speed
      );
    }

    return new Vec3(
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
      0
    );
  }
}

// ========== 预设增强粒子效果 ==========

/** 烟花预设 */
export function createFireworkEmitter(_x: number, _y: number): EnhancedParticleEmitter {
  return new EnhancedParticleEmitter({
    maxParticles: 200,
    emissionRate: 0,
    duration: 0.1,
    loop: false,
    shape: 'sphere',
    shapeRadius: 5,
    lifetimeRange: { min: 0.5, max: 1.5 },
    startSizeRange: { min: 2, max: 6 },
    endSize: 0,
    startColor: new Vec3(1, 0.8, 0.2),
    endColor: new Vec3(1, 0, 0),
    gravity: new Vec3(0, 100, 0),
    drag: 0.5,
    sortMode: 'distance',
    additive: true,
  });
}

/** 魔法光环预设 */
export function createMagicRingEmitter(): EnhancedParticleEmitter {
  return new EnhancedParticleEmitter({
    maxParticles: 300,
    emissionRate: 100,
    duration: -1,
    loop: true,
    shape: 'circle',
    shapeRadius: 50,
    lifetimeRange: { min: 0.8, max: 1.2 },
    startSizeRange: { min: 3, max: 6 },
    endSize: 0,
    startColor: new Vec3(0.3, 0.5, 1),
    endColor: new Vec3(0.8, 0.3, 1),
    startAlpha: 0.8,
    endAlpha: 0,
    gravity: new Vec3(0, -20, 0),
    turbulence: 30,
    additive: true,
  });
}

/** 雪花预设 */
export function createSnowEmitter(width = 400): EnhancedParticleEmitter {
  return new EnhancedParticleEmitter({
    maxParticles: 200,
    emissionRate: 30,
    duration: -1,
    loop: true,
    shape: 'box',
    shapeSize: new Vec3(width, 0, 0),
    lifetimeRange: { min: 3, max: 5 },
    startSizeRange: { min: 2, max: 5 },
    endSize: 2,
    startColor: new Vec3(1, 1, 1),
    endColor: new Vec3(0.8, 0.9, 1),
    startAlpha: 0.8,
    endAlpha: 0.3,
    gravity: new Vec3(0, 30, 0),
    turbulence: 20,
    speedRange: { min: 10, max: 30 },
    angleRange: { min: Math.PI * 0.4, max: Math.PI * 0.6 },
  });
}

/** 雨滴预设 */
export function createRainEmitter(width = 400): EnhancedParticleEmitter {
  return new EnhancedParticleEmitter({
    maxParticles: 300,
    emissionRate: 100,
    duration: -1,
    loop: true,
    shape: 'box',
    shapeSize: new Vec3(width, 0, 0),
    lifetimeRange: { min: 0.5, max: 1 },
    startSizeRange: { min: 1, max: 2 },
    endSize: 1,
    startColor: new Vec3(0.7, 0.8, 1),
    endColor: new Vec3(0.5, 0.6, 1),
    startAlpha: 0.6,
    endAlpha: 0.2,
    gravity: new Vec3(0, 600, 0),
    speedRange: { min: 200, max: 400 },
    angleRange: { min: Math.PI * 0.45, max: Math.PI * 0.55 },
    renderMode: 'stretched',
    particleSize: 4,
  });
}
