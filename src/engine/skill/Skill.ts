export type SkillState = 'ready' | 'casting' | 'cooldown' | 'active';

export interface SkillEffect {
  type: string;
  value: number;
  target?: string;
  radius?: number;
  duration?: number;
}

export interface SkillConfig {
  id: string;
  name: string;
  description?: string;
  cooldown: number;
  cost?: number;
  range?: number;
  damage?: number;
  duration?: number;
  castTime?: number;
  effects?: SkillEffect[];
}

export class Skill {
  private state: SkillState = 'ready';
  private cooldownRemaining = 0;
  private castRemaining = 0;
  private activeRemaining = 0;

  constructor(readonly config: SkillConfig) {}

  get id(): string {
    return this.config.id;
  }

  getState(): SkillState {
    return this.state;
  }

  getCooldownProgress(): number {
    if (this.config.cooldown <= 0) return 0;
    return Math.max(0, Math.min(1, this.cooldownRemaining / this.config.cooldown));
  }

  canCast(): boolean {
    return this.state === 'ready';
  }

  cast(): boolean {
    if (!this.canCast()) return false;
    const castTime = this.config.castTime ?? 0;
    if (castTime > 0) {
      this.state = 'casting';
      this.castRemaining = castTime;
    } else {
      this.enterActiveOrCooldown();
    }
    return true;
  }

  update(dt: number): void {
    if (this.state === 'casting') {
      this.castRemaining -= dt;
      if (this.castRemaining <= 0) {
        this.castRemaining = 0;
        this.enterActiveOrCooldown();
      }
      return;
    }

    if (this.state === 'active') {
      this.activeRemaining -= dt;
      if (this.activeRemaining <= 0) {
        this.activeRemaining = 0;
        this.enterCooldown();
      }
      return;
    }

    if (this.state === 'cooldown') {
      this.cooldownRemaining -= dt;
      if (this.cooldownRemaining <= 0) {
        this.cooldownRemaining = 0;
        this.state = 'ready';
      }
    }
  }

  reset(): void {
    this.state = 'ready';
    this.cooldownRemaining = 0;
    this.castRemaining = 0;
    this.activeRemaining = 0;
  }

  private enterActiveOrCooldown(): void {
    const duration = this.config.duration ?? 0;
    if (duration > 0) {
      this.state = 'active';
      this.activeRemaining = duration;
      return;
    }
    this.enterCooldown();
  }

  private enterCooldown(): void {
    if (this.config.cooldown > 0) {
      this.state = 'cooldown';
      this.cooldownRemaining = this.config.cooldown;
      return;
    }
    this.state = 'ready';
  }
}
