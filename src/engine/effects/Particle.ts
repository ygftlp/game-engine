// 粒子系统：支持发射器配置、粒子生命周期、预设效果。
import { Node } from '../core/Node';
import { Renderer } from '../render/Renderer';
import { Vec2 } from '../math/Vec2';

/** 粒子配置 */
export interface ParticleConfig {
  /** 粒子颜色 */
  color: string;
  /** 粒子颜色2（渐变到此颜色） */
  color2?: string;
  /** 起始大小 */
  size: number;
  /** 结束大小 */
  sizeEnd?: number;
  /** 起始透明度 */
  alpha?: number;
  /** 结束透明度 */
  alphaEnd?: number;
  /** 生命时长（秒） */
  life: number;
  /** 初始速度（像素/秒） */
  velocity: Vec2;
  /** 加速度（像素/秒²） */
  acceleration?: Vec2;
  /** 重力 */
  gravity?: number;
  /** 旋转速度（弧度/秒） */
  rotateSpeed?: number;
}

/** 发射器配置 */
export interface EmitterConfig {
  /** 发射位置 X */
  x: number;
  /** 发射位置 Y */
  y: number;
  /** 每秒发射数量 */
  rate: number;
  /** 最大粒子数 */
  maxParticles: number;
  /** 单个粒子配置工厂函数 */
  particleFactory: () => ParticleConfig;
  /** 发射角度范围（弧度，默认 0-2PI） */
  angleRange?: { min: number; max: number };
  /** 速度范围倍率 */
  speedRange?: { min: number; max: number };
  /** 发射形状：point 或 circle */
  emitShape?: 'point' | 'circle';
  /** 发射形状半径（circle 模式） */
  emitRadius?: number;
}

/** 内部粒子状态 */
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ax: number;
  ay: number;
  gravity: number;
  size: number;
  sizeEnd: number;
  alpha: number;
  alphaEnd: number;
  color: string;
  color2: string | null;
  life: number;
  maxLife: number;
  rotation: number;
  rotateSpeed: number;
}

/**
 * 粒子发射器：挂载到场景树中作为 Node 使用。
 *
 * 使用示例：
 *   const emitter = new ParticleEmitter({
 *     x: 0, y: 0,
 *     rate: 50,
 *     maxParticles: 200,
 *     particleFactory: () => ({
 *       color: '#ff0000',
 *       size: 4,
 *       sizeEnd: 0,
 *       alpha: 1,
 *       alphaEnd: 0,
 *       life: 1.5,
 *       velocity: new Vec2((Math.random() - 0.5) * 100, -Math.random() * 150),
 *       gravity: 200,
 *     }),
 *   });
 *   scene.addChild(emitter);
 *   emitter.play();
 */
export class ParticleEmitter extends Node {
  private config: EmitterConfig;
  private particles: Particle[] = [];
  private emitAccumulator = 0;
  private _playing = false;
  private _duration = 0;
  private _elapsed = 0;
  private _loop = true;
  private colorCache = new Map<string, { r: number; g: number; b: number }>();

  constructor(config: EmitterConfig) {
    super();
    this.config = config;
    this.width = 0;
    this.height = 0;
  }

  /** 开始发射。 */
  play(loop = true): void {
    this._playing = true;
    this._loop = loop;
    this._elapsed = 0;
    this._duration = this.config.maxParticles / this.config.rate;
  }

  /** 停止发射（已发射的粒子继续播放到结束）。 */
  stop(): void {
    this._playing = false;
  }

  /** 立即清空所有粒子。 */
  clear(): void {
    this.particles.length = 0;
  }

  /** 是否正在播放。 */
  isPlaying(): boolean {
    return this._playing;
  }

  /** 当前粒子数量。 */
  get particleCount(): number {
    return this.particles.length;
  }

  /** 更新配置。 */
  updateConfig(config: Partial<EmitterConfig>): void {
    Object.assign(this.config, config);
  }

  /** 移动发射位置。 */
  setPosition(x: number, y: number): void {
    this.config.x = x;
    this.config.y = y;
  }

  update(dt: number): void {
    // 发射新粒子
    if (this._playing) {
      this._elapsed += dt;
      if (this._loop || this._elapsed <= this._duration) {
        this.emitAccumulator += this.config.rate * dt;
        while (this.emitAccumulator >= 1 && this.particles.length < this.config.maxParticles) {
          this.emitParticle();
          this.emitAccumulator -= 1;
        }
      } else {
        this._playing = false;
      }
    }

    // 更新现有粒子
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      // 物理更新
      p.vx += p.ax * dt;
      p.vy += (p.ay + p.gravity) * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rotation += p.rotateSpeed * dt;
    }
  }

  protected draw(renderer: Renderer): void {
    const ctx = renderer.ctx;

    for (const p of this.particles) {
      const t = 1 - p.life / p.maxLife;
      const size = p.size + (p.sizeEnd - p.size) * t;
      const alpha = p.alpha + (p.alphaEnd - p.alpha) * t;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);

      // 颜色插值
      if (p.color2) {
        ctx.fillStyle = this.lerpColor(p.color, p.color2, t);
      } else {
        ctx.fillStyle = p.color;
      }

      ctx.fillRect(-size / 2, -size / 2, size, size);
      ctx.restore();
    }
  }

  private emitParticle(): void {
    const cfg = this.config;
    const pc = cfg.particleFactory();

    let angle: number;
    let speed: number;

    if (cfg.angleRange) {
      angle = cfg.angleRange.min + Math.random() * (cfg.angleRange.max - cfg.angleRange.min);
    } else {
      angle = Math.random() * Math.PI * 2;
    }

    if (cfg.speedRange) {
      speed = cfg.speedRange.min + Math.random() * (cfg.speedRange.max - cfg.speedRange.min);
    } else {
      speed = Math.sqrt(pc.velocity.x * pc.velocity.x + pc.velocity.y * pc.velocity.y) || 1;
    }

    let px = cfg.x;
    let py = cfg.y;
    if (cfg.emitShape === 'circle' && cfg.emitRadius) {
      const r = Math.random() * cfg.emitRadius;
      const a = Math.random() * Math.PI * 2;
      px += r * Math.cos(a);
      py += r * Math.sin(a);
    }

    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;

    this.particles.push({
      x: px,
      y: py,
      vx,
      vy,
      ax: pc.acceleration?.x ?? 0,
      ay: pc.acceleration?.y ?? 0,
      gravity: pc.gravity ?? 0,
      size: pc.size,
      sizeEnd: pc.sizeEnd ?? pc.size,
      alpha: pc.alpha ?? 1,
      alphaEnd: pc.alphaEnd ?? 0,
      color: pc.color,
      color2: pc.color2 ?? null,
      life: pc.life,
      maxLife: pc.life,
      rotation: 0,
      rotateSpeed: pc.rotateSpeed ?? 0,
    });
  }

  private lerpColor(c1: string, c2: string, t: number): string {
    const a = this.parseColor(c1);
    const b = this.parseColor(c2);
    const r = Math.round(a.r + (b.r - a.r) * t);
    const g = Math.round(a.g + (b.g - a.g) * t);
    const bl = Math.round(a.b + (b.b - a.b) * t);
    return `rgb(${r},${g},${bl})`;
  }

  private parseColor(color: string): { r: number; g: number; b: number } {
    const cached = this.colorCache.get(color);
    if (cached) return cached;

    let r = 0, g = 0, b = 0;
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      if (hex.length === 3) {
        r = parseInt(hex[0] + hex[0], 16);
        g = parseInt(hex[1] + hex[1], 16);
        b = parseInt(hex[2] + hex[2], 16);
      } else if (hex.length === 6) {
        r = parseInt(hex.slice(0, 2), 16);
        g = parseInt(hex.slice(2, 4), 16);
        b = parseInt(hex.slice(4, 6), 16);
      }
    }
    const result = { r, g, b };
    this.colorCache.set(color, result);
    return result;
  }
}

// ========== 预设粒子效果 ==========

/** 爆炸效果预设 */
export function createExplosionEmitter(x: number, y: number): ParticleEmitter {
  return new ParticleEmitter({
    x, y,
    rate: 0,
    maxParticles: 50,
    emitShape: 'point',
    particleFactory: () => ({
      color: '#ff6600',
      color2: '#ff0000',
      size: 6,
      sizeEnd: 0,
      alpha: 1,
      alphaEnd: 0,
      life: 0.8,
      velocity: new Vec2(0, 0),
      gravity: 0,
    }),
    angleRange: { min: 0, max: Math.PI * 2 },
    speedRange: { min: 100, max: 250 },
  });
}

/** 火焰效果预设 */
export function createFireEmitter(x: number, y: number): ParticleEmitter {
  return new ParticleEmitter({
    x, y,
    rate: 30,
    maxParticles: 100,
    emitShape: 'circle',
    emitRadius: 5,
    particleFactory: () => ({
      color: '#ffaa00',
      color2: '#ff3300',
      size: 8,
      sizeEnd: 2,
      alpha: 0.8,
      alphaEnd: 0,
      life: 1,
      velocity: new Vec2(0, -80),
      gravity: -50,
      rotateSpeed: (Math.random() - 0.5) * 2,
    }),
    angleRange: { min: -Math.PI * 0.3, max: -Math.PI * 0.7 },
    speedRange: { min: 30, max: 80 },
  });
}

/** 烟雾效果预设 */
export function createSmokeEmitter(x: number, y: number): ParticleEmitter {
  return new ParticleEmitter({
    x, y,
    rate: 15,
    maxParticles: 60,
    emitShape: 'circle',
    emitRadius: 3,
    particleFactory: () => ({
      color: '#888888',
      color2: '#cccccc',
      size: 10,
      sizeEnd: 30,
      alpha: 0.5,
      alphaEnd: 0,
      life: 2,
      velocity: new Vec2(0, -40),
      gravity: -10,
      rotateSpeed: (Math.random() - 0.5) * 0.5,
    }),
    angleRange: { min: -Math.PI * 0.4, max: -Math.PI * 0.6 },
    speedRange: { min: 20, max: 50 },
  });
}

/** 星星/闪光效果预设 */
export function createSparkleEmitter(x: number, y: number): ParticleEmitter {
  return new ParticleEmitter({
    x, y,
    rate: 20,
    maxParticles: 40,
    emitShape: 'circle',
    emitRadius: 2,
    particleFactory: () => ({
      color: '#ffffff',
      color2: '#ffff00',
      size: 3,
      sizeEnd: 0,
      alpha: 1,
      alphaEnd: 0,
      life: 0.6,
      velocity: new Vec2(0, 0),
    }),
    angleRange: { min: 0, max: Math.PI * 2 },
    speedRange: { min: 20, max: 60 },
  });
}
