// 技能系统核心模块
import { Component } from '../core/Component';
import { Node } from '../core/Node';
import { EventEmitter } from '../core/EventEmitter';
import { TimerManager } from '../utils/Timer';

// ==================== 技能配置接口 ====================
export interface SkillConfig {
  id: string;
  name: string;
  description: string;
  cooldown: number;          // 冷却时间（秒）
  cost: number;              // 消耗（魔法值等）
  range: number;             // 技能范围
  damage: number;            // 基础伤害
  duration: number;          // 持续时间（秒）
  castTime: number;          // 施法前摇（秒）
  effects: EffectConfig[];   // 效果列表
  animation?: AnimationConfig;
}

export interface EffectConfig {
  type: 'damage' | 'heal' | 'buff' | 'debuff' | 'projectile' | 'aoe';
  value: number;
  duration?: number;
  radius?: number;
  target: 'self' | 'enemy' | 'ally' | 'area';
}

export interface AnimationConfig {
  castAnim?: string;
  hitAnim?: string;
  particle?: string;
}

// ==================== 技能状态枚举 ====================
export enum SkillState {
  Ready = 'ready',
  Casting = 'casting',
  Cooldown = 'cooldown',
  Active = 'active',
}

// ==================== 技能基类 ====================
export class Skill extends EventEmitter {
  readonly config: SkillConfig;
  private state: SkillState = SkillState.Ready;
  private cooldownTimer = 0;
  private castTimer = 0;
  private owner: Node | null = null;

  constructor(config: SkillConfig) {
    super();
    this.config = config;
  }

  /** 设置技能所有者 */
  setOwner(owner: Node): void {
    this.owner = owner;
  }

  /** 获取技能所有者 */
  getOwner(): Node | null {
    return this.owner;
  }

  /** 获取技能状态 */
  getState(): SkillState {
    return this.state;
  }

  /** 获取冷却剩余时间 */
  getCooldownRemaining(): number {
    return this.cooldownTimer;
  }

  /** 获取冷却进度（0-1） */
  getCooldownProgress(): number {
    if (this.config.cooldown === 0) return 0;
    return this.cooldownTimer / this.config.cooldown;
  }

  /** 是否可以施放 */
  canCast(): boolean {
    return this.state === SkillState.Ready && this.cooldownTimer <= 0;
  }

  /** 开始施放技能 */
  cast(target?: Node): boolean {
    if (!this.canCast()) {
      this.emit('castFailed', { reason: 'cooldown', skill: this });
      return false;
    }

    this.state = SkillState.Casting;
    this.castTimer = this.config.castTime;
    this.emit('castStart', { skill: this, target });

    // 如果没有前摇，立即执行
    if (this.config.castTime <= 0) {
      this.executeSkill(target);
    }

    return true;
  }

  /** 执行技能效果 */
  private executeSkill(target?: Node): void {
    this.state = SkillState.Active;
    this.emit('castComplete', { skill: this, target });

    // 应用所有效果
    for (const effectConfig of this.config.effects) {
      this.applyEffect(effectConfig, target);
    }

    // 开始冷却
    this.startCooldown();
  }

  /** 应用效果 */
  private applyEffect(config: EffectConfig, target?: Node): void {
    const effect: SkillEffect = {
      type: config.type,
      value: config.value,
      duration: config.duration || 0,
      radius: config.radius || 0,
      target: config.target,
      source: this.owner,
      skill: this,
    };

    this.emit('effectApply', { effect, target });
  }

  /** 开始冷却 */
  private startCooldown(): void {
    this.state = SkillState.Cooldown;
    this.cooldownTimer = this.config.cooldown;
    this.emit('cooldownStart', { skill: this, duration: this.config.cooldown });
  }

  /** 更新技能状态 */
  update(dt: number): void {
    // 更新施法前摇
    if (this.state === SkillState.Casting) {
      this.castTimer -= dt;
      if (this.castTimer <= 0) {
        this.executeSkill();
      }
    }

    // 更新冷却
    if (this.state === SkillState.Cooldown) {
      this.cooldownTimer -= dt;
      if (this.cooldownTimer <= 0) {
        this.cooldownTimer = 0;
        this.state = SkillState.Ready;
        this.emit('cooldownEnd', { skill: this });
      }
    }
  }

  /** 重置技能 */
  reset(): void {
    this.state = SkillState.Ready;
    this.cooldownTimer = 0;
    this.castTimer = 0;
  }
}

// ==================== 技能效果接口 ====================
export interface SkillEffect {
  type: string;
  value: number;
  duration: number;
  radius: number;
  target: string;
  source: Node | null;
  skill: Skill;
}

// ==================== 技能管理器 ====================
export class SkillManager extends Component {
  private skills = new Map<string, Skill>();
  private activeEffects: ActiveEffect[] = [];
  private timerManager = new TimerManager();

  /** 添加技能 */
  addSkill(config: SkillConfig): Skill {
    const skill = new Skill(config);
    if (this.node) {
      skill.setOwner(this.node);
    }
    this.skills.set(config.id, skill);
    return skill;
  }

  /** 移除技能 */
  removeSkill(skillId: string): void {
    this.skills.delete(skillId);
  }

  /** 获取技能 */
  getSkill(skillId: string): Skill | undefined {
    return this.skills.get(skillId);
  }

  /** 施放技能 */
  castSkill(skillId: string, target?: Node): boolean {
    const skill = this.skills.get(skillId);
    if (!skill) return false;
    return skill.cast(target);
  }

  /** 检查技能是否可以施放 */
  canCastSkill(skillId: string): boolean {
    const skill = this.skills.get(skillId);
    return skill ? skill.canCast() : false;
  }

  /** 添加持续效果 */
  addEffect(effect: ActiveEffect): void {
    this.activeEffects.push(effect);
  }

  /** 移除效果 */
  removeEffect(effectId: string): void {
    this.activeEffects = this.activeEffects.filter(e => e.id !== effectId);
  }

  /** 每帧更新 */
  onUpdate(dt: number): void {
    // 更新所有技能
    for (const skill of this.skills.values()) {
      skill.update(dt);
    }

    // 更新定时器
    this.timerManager.update(dt);

    // 更新持续效果
    this.updateEffects(dt);
  }

  /** 更新持续效果 */
  private updateEffects(dt: number): void {
    for (let i = this.activeEffects.length - 1; i >= 0; i--) {
      const effect = this.activeEffects[i];
      effect.remaining -= dt;

      if (effect.remaining <= 0) {
        effect.onExpire?.();
        this.activeEffects.splice(i, 1);
      } else {
        effect.onTick?.(dt);
      }
    }
  }

  /** 销毁时清理 */
  onDetach(): void {
    this.skills.clear();
    this.activeEffects.length = 0;
    this.timerManager.clear();
  }
}

// ==================== 持续效果接口 ====================
export interface ActiveEffect {
  id: string;
  name: string;
  remaining: number;
  duration: number;
  onTick?: (dt: number) => void;
  onExpire?: () => void;
}

// ==================== 技能效果组件 ====================
export class DamageEffectComponent extends Component {
  private damage = 0;
  private target: Node | null = null;
  private onDamageCallback: ((damage: number, source: Node | null) => void) | null = null;

  setDamage(damage: number): void {
    this.damage = damage;
  }

  setTarget(target: Node): void {
    this.target = target;
  }

  setOnDamageCallback(callback: (damage: number, source: Node | null) => void): void {
    this.onDamageCallback = callback;
  }

  apply(): void {
    if (!this.target) return;

    // 触发伤害回调
    this.onDamageCallback?.(this.damage, this.node);
  }
}

// ==================== 技能动画组件 ====================
export class SkillAnimationComponent extends Component {
  private _castAnim: string | null = null;
  private _hitAnim: string | null = null;

  setCastAnimation(animName: string): void {
    this._castAnim = animName;
  }

  setHitAnimation(animName: string): void {
    this._hitAnim = animName;
  }

  get castAnim(): string | null {
    return this._castAnim;
  }

  get hitAnim(): string | null {
    return this._hitAnim;
  }

  playCastAnimation(): void {
    // 动画播放逻辑
  }

  playHitAnimation(): void {
    // 动画播放逻辑
  }
}

// ==================== 技能配置管理器 ====================
export class SkillConfigManager {
  private configs = new Map<string, SkillConfig>();

  /** 加载技能配置 */
  loadConfig(configs: SkillConfig[]): void {
    for (const config of configs) {
      this.configs.set(config.id, config);
    }
  }

  /** 获取技能配置 */
  getConfig(skillId: string): SkillConfig | undefined {
    return this.configs.get(skillId);
  }

  /** 获取所有配置 */
  getAllConfigs(): SkillConfig[] {
    return Array.from(this.configs.values());
  }
}

// ==================== 预设技能配置 ====================
export const SKILL_PRESETS: Record<string, SkillConfig> = {
  // 近战攻击
  meleeAttack: {
    id: 'meleeAttack',
    name: '近战攻击',
    description: '对目标造成物理伤害',
    cooldown: 1.0,
    cost: 0,
    range: 50,
    damage: 10,
    duration: 0,
    castTime: 0.3,
    effects: [
      { type: 'damage', value: 10, target: 'enemy' }
    ],
    animation: {
      castAnim: 'attack',
      hitAnim: 'hit',
    },
  },

  // 远程攻击
  rangedAttack: {
    id: 'rangedAttack',
    name: '远程攻击',
    description: '发射投射物造成伤害',
    cooldown: 1.5,
    cost: 5,
    range: 200,
    damage: 15,
    duration: 0,
    castTime: 0.5,
    effects: [
      { type: 'projectile', value: 15, target: 'enemy' }
    ],
    animation: {
      castAnim: 'cast',
    },
  },

  // 治疗技能
  heal: {
    id: 'heal',
    name: '治疗',
    description: '恢复自身生命值',
    cooldown: 5.0,
    cost: 20,
    range: 0,
    damage: 0,
    duration: 0,
    castTime: 1.0,
    effects: [
      { type: 'heal', value: 30, target: 'self' }
    ],
    animation: {
      castAnim: 'heal',
    },
  },

  // AOE技能
  fireball: {
    id: 'fireball',
    name: '火球术',
    description: '对范围内的敌人造成火焰伤害',
    cooldown: 3.0,
    cost: 15,
    range: 150,
    damage: 25,
    duration: 0,
    castTime: 0.8,
    effects: [
      { type: 'aoe', value: 25, radius: 80, target: 'area' }
    ],
    animation: {
      castAnim: 'cast',
      hitAnim: 'explosion',
      particle: 'fire',
    },
  },

  // 增益技能
  powerUp: {
    id: 'powerUp',
    name: '力量增强',
    description: '临时提升攻击力',
    cooldown: 10.0,
    cost: 25,
    range: 0,
    damage: 0,
    duration: 5.0,
    castTime: 0.5,
    effects: [
      { type: 'buff', value: 50, duration: 5.0, target: 'self' }
    ],
    animation: {
      castAnim: 'buff',
    },
  },
};
