// 分数与成就系统：支持积分、排行榜、成就解锁、统计追踪。

import { IPlatform } from '../platform/Platform';

/** 简单事件发射器（内部使用） */
class SimpleEventEmitter {
  private listeners = new Map<string, Array<(...args: unknown[]) => void>>();

  on(event: string, fn: (...args: unknown[]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(fn);
  }

  off(event: string, fn: (...args: unknown[]) => void): void {
    const list = this.listeners.get(event);
    if (list) {
      const idx = list.indexOf(fn);
      if (idx >= 0) list.splice(idx, 1);
    }
  }

  emit(event: string, ...args: unknown[]): void {
    const list = this.listeners.get(event);
    if (list) {
      for (const fn of list) {
        fn(...args);
      }
    }
  }
}

/** 成就定义 */
export interface Achievement {
  id: string;
  name: string;
  description: string;
  /** 图标 */
  icon?: string;
  /** 成就条件 */
  condition: (stats: GameStats) => boolean;
  /** 是否隐藏 */
  hidden?: boolean;
  /** 解锁奖励 */
  reward?: Record<string, unknown>;
}

/** 解锁的成就 */
export interface UnlockedAchievement {
  id: string;
  unlockedAt: number;
  reward?: Record<string, unknown>;
}

/** 游戏统计数据 */
export interface GameStats {
  /** 游戏时长（秒） */
  playTime: number;
  /** 关卡完成数 */
  levelsCompleted: number;
  /** 总分数 */
  totalScore: number;
  /** 最高分 */
  highScore: number;
  /** 击杀数 */
  kills: number;
  /** 死亡数 */
  deaths: number;
  /** 收集物数量 */
  collectibles: number;
  /** 自定义统计 */
  custom: Record<string, number>;
}

/** 分数事件 */
export interface ScoreEvent {
  type: 'score' | 'combo' | 'multiplier';
  value: number;
  timestamp: number;
  source?: string;
}

/**
 * 分数管理器
 */
export class ScoreManager extends SimpleEventEmitter {
  private score = 0;
  private multiplier = 1;
  private combo = 0;
  private comboTimer = 0;
  private comboTimeout = 2;
  private highScore = 0;
  private scoreHistory: ScoreEvent[] = [];

  constructor(private platform?: IPlatform) {
    super();
    this.loadHighScore();
  }

  /** 增加分数 */
  addScore(value: number, source?: string): void {
    const finalValue = value * this.multiplier;
    this.score += finalValue;
    this.combo++;
    this.comboTimer = this.comboTimeout;

    const event: ScoreEvent = {
      type: this.combo > 1 ? 'combo' : 'score',
      value: finalValue,
      timestamp: Date.now(),
      source,
    };

    this.scoreHistory.push(event);
    this.emit('scoreChanged', this.score);
    this.emit('scoreEvent', event);

    if (this.combo > 1) {
      this.emit('comboChanged', this.combo);
    }

    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.emit('newHighScore', this.highScore);
      this.saveHighScore();
    }
  }

  /** 扣除分数 */
  subtractScore(value: number): void {
    this.score = Math.max(0, this.score - value);
    this.emit('scoreChanged', this.score);
  }

  /** 设置分数 */
  setScore(value: number): void {
    this.score = value;
    this.emit('scoreChanged', this.score);
  }

  /** 获取当前分数 */
  getScore(): number {
    return this.score;
  }

  /** 获取最高分 */
  getHighScore(): number {
    return this.highScore;
  }

  /** 设置连击超时时间 */
  setComboTimeout(timeout: number): void {
    this.comboTimeout = timeout;
  }

  /** 设置分数倍率 */
  setMultiplier(value: number): void {
    this.multiplier = value;
    this.emit('multiplierChanged', this.multiplier);
  }

  /** 获取当前倍率 */
  getMultiplier(): number {
    return this.multiplier;
  }

  /** 获取当前连击数 */
  getCombo(): number {
    return this.combo;
  }

  /** 获取分数历史 */
  getHistory(): ScoreEvent[] {
    return [...this.scoreHistory];
  }

  /** 每帧更新（连击计时） */
  update(dt: number): void {
    if (this.combo > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.combo = 0;
        this.multiplier = 1;
        this.emit('comboEnded', 0);
      }
    }
  }

  /** 重置分数 */
  reset(): void {
    this.score = 0;
    this.multiplier = 1;
    this.combo = 0;
    this.scoreHistory.length = 0;
    this.emit('scoreChanged', 0);
  }

  private loadHighScore(): void {
    if (!this.platform) return;
    const json = this.platform.getStorage('highscore');
    if (json) {
      this.highScore = parseInt(json, 10) || 0;
    }
  }

  private saveHighScore(): void {
    this.platform?.setStorage('highscore', String(this.highScore));
  }
}

/**
 * 成就管理器
 */
export class AchievementManager extends SimpleEventEmitter {
  private achievements: Achievement[] = [];
  private unlocked = new Map<string, UnlockedAchievement>();
  private platform: IPlatform | null;

  constructor(platform?: IPlatform) {
    super();
    this.platform = platform ?? null;
    this.loadUnlocked();
  }

  /** 注册成就 */
  register(achievement: Achievement): void {
    this.achievements.push(achievement);
  }

  /** 批量注册成就 */
  registerAll(achievements: Achievement[]): void {
    this.achievements.push(...achievements);
  }

  /** 检查成就解锁 */
  check(stats: GameStats): UnlockedAchievement[] {
    const newlyUnlocked: UnlockedAchievement[] = [];

    for (const achievement of this.achievements) {
      if (this.unlocked.has(achievement.id)) continue;

      if (achievement.condition(stats)) {
        const unlocked: UnlockedAchievement = {
          id: achievement.id,
          unlockedAt: Date.now(),
          reward: achievement.reward,
        };

        this.unlocked.set(achievement.id, unlocked);
        newlyUnlocked.push(unlocked);

        this.emit('achievementUnlocked', achievement);
      }
    }

    if (newlyUnlocked.length > 0) {
      this.saveUnlocked();
    }

    return newlyUnlocked;
  }

  /** 手动解锁成就 */
  unlock(achievementId: string): boolean {
    if (this.unlocked.has(achievementId)) return false;

    const achievement = this.achievements.find(a => a.id === achievementId);
    if (!achievement) return false;

    const unlocked: UnlockedAchievement = {
      id: achievementId,
      unlockedAt: Date.now(),
      reward: achievement.reward,
    };

    this.unlocked.set(achievementId, unlocked);
    this.saveUnlocked();

    this.emit('achievementUnlocked', achievement);
    return true;
  }

  /** 检查成就是否已解锁 */
  isUnlocked(achievementId: string): boolean {
    return this.unlocked.has(achievementId);
  }

  /** 获取已解锁的成就 */
  getUnlocked(): UnlockedAchievement[] {
    return Array.from(this.unlocked.values());
  }

  /** 获取成就定义 */
  getAchievement(id: string): Achievement | undefined {
    return this.achievements.find(a => a.id === id);
  }

  /** 获取所有成就（含解锁状态） */
  getAllWithStatus(): Array<Achievement & { unlocked: boolean; unlockedAt?: number }> {
    return this.achievements.map(a => ({
      ...a,
      unlocked: this.unlocked.has(a.id),
      unlockedAt: this.unlocked.get(a.id)?.unlockedAt,
    }));
  }

  /** 获取解锁进度 */
  getProgress(): { total: number; unlocked: number; percentage: number } {
    const total = this.achievements.length;
    const unlocked = this.unlocked.size;
    return {
      total,
      unlocked,
      percentage: total > 0 ? (unlocked / total) * 100 : 0,
    };
  }

  /** 重置所有成就 */
  reset(): void {
    this.unlocked.clear();
    this.saveUnlocked();
    this.emit('allAchievementsReset');
  }

  private loadUnlocked(): void {
    if (!this.platform) return;
    const json = this.platform.getStorage('achievements');
    if (json) {
      try {
        const data = JSON.parse(json) as UnlockedAchievement[];
        for (const item of data) {
          this.unlocked.set(item.id, item);
        }
      } catch { /* ignore parse errors */ }
    }
  }

  private saveUnlocked(): void {
    if (!this.platform) return;
    const data = Array.from(this.unlocked.values());
    this.platform.setStorage('achievements', JSON.stringify(data));
  }
}

/**
 * 统计追踪器
 */
export class StatsTracker extends SimpleEventEmitter {
  private stats: GameStats = {
    playTime: 0,
    levelsCompleted: 0,
    totalScore: 0,
    highScore: 0,
    kills: 0,
    deaths: 0,
    collectibles: 0,
    custom: {},
  };

  private platform: IPlatform | null;

  constructor(platform?: IPlatform) {
    super();
    this.platform = platform ?? null;
    this.load();
  }

  /** 增加统计值 */
  increment(stat: keyof GameStats, value = 1): void {
    if (stat === 'custom') return;
    (this.stats[stat] as number) += value;
    this.emit('statChanged', stat, this.stats[stat]);
    this.save();
  }

  /** 设置统计值 */
  set(stat: keyof GameStats, value: number): void {
    if (stat === 'custom') return;
    (this.stats[stat] as number) = value;
    this.emit('statChanged', stat, this.stats[stat]);
    this.save();
  }

  /** 设置自定义统计 */
  setCustom(key: string, value: number): void {
    this.stats.custom[key] = value;
    this.emit('customStatChanged', key, value);
    this.save();
  }

  /** 增加自定义统计 */
  incrementCustom(key: string, value = 1): void {
    this.stats.custom[key] = (this.stats.custom[key] ?? 0) + value;
    this.emit('customStatChanged', key, this.stats.custom[key]);
    this.save();
  }

  /** 获取统计值 */
  get(stat: keyof GameStats): number {
    if (stat === 'custom') return 0;
    return this.stats[stat] as number;
  }

  /** 获取自定义统计 */
  getCustom(key: string): number {
    return this.stats.custom[key] ?? 0;
  }

  /** 获取所有统计 */
  getAll(): GameStats {
    return { ...this.stats, custom: { ...this.stats.custom } };
  }

  /** 更新游戏时长 */
  updatePlayTime(dt: number): void {
    this.stats.playTime += dt;
  }

  /** 重置统计 */
  reset(): void {
    this.stats = {
      playTime: 0,
      levelsCompleted: 0,
      totalScore: 0,
      highScore: 0,
      kills: 0,
      deaths: 0,
      collectibles: 0,
      custom: {},
    };
    this.save();
  }

  private load(): void {
    if (!this.platform) return;
    const json = this.platform.getStorage('game_stats');
    if (json) {
      try {
        const data = JSON.parse(json) as GameStats;
        Object.assign(this.stats, data);
      } catch { /* ignore parse errors */ }
    }
  }

  private save(): void {
    if (!this.platform) return;
    this.platform.setStorage('game_stats', JSON.stringify(this.stats));
  }
}
