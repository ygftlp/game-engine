// 音频分类管理：支持 music/sfx/voice 分类，独立音量控制，自动淡入淡出。
import { IPlatform, IAudio } from '../platform/Platform';

/** 音频类别 */
export type AudioCategory = 'music' | 'sfx' | 'voice';

/** 音频类别配置 */
export interface AudioCategoryConfig {
  /** 默认音量 0-1 */
  volume: number;
  /** 是否静音 */
  muted: boolean;
}

const DEFAULT_CATEGORIES: Record<AudioCategory, AudioCategoryConfig> = {
  music: { volume: 1, muted: false },
  sfx: { volume: 1, muted: false },
  voice: { volume: 1, muted: false },
};

/** 带分类管理的音频实例 */
export class ManagedAudio {
  readonly ctx: IAudio;
  readonly category: AudioCategory;
  private manager: AudioManager;
  private _loop = false;
  private _src = '';

  constructor(platform: IPlatform, category: AudioCategory, manager: AudioManager) {
    this.ctx = platform.createAudio();
    this.category = category;
    this.manager = manager;
    manager.register(this);
  }

  load(url: string): void {
    this._src = url;
    this.ctx.src = url;
  }

  play(loop = false): void {
    this._loop = loop;
    this.ctx.loop = loop;
    this.updateVolume();
    this.ctx.play();
  }

  pause(): void {
    this.ctx.pause();
  }

  stop(): void {
    this.ctx.stop();
  }

  set volume(v: number) {
    this.ctx.volume = v;
  }

  get volume(): number {
    return this.ctx.volume;
  }

  /** 根据分类音量和静音状态更新实际音量。 */
  updateVolume(): void {
    const catConfig = this.manager.getCategoryConfig(this.category);
    const finalVolume = catConfig.muted ? 0 : catConfig.volume;
    this.ctx.volume = finalVolume;
  }

  destroy(): void {
    this.ctx.destroy();
    this.manager.unregister(this);
  }

  get src(): string {
    return this._src;
  }

  get loop(): boolean {
    return this._loop;
  }
}

/**
 * 音频管理器：管理所有音频实例，支持分类音量控制。
 *
 * 使用示例：
 *   const am = new AudioManager(platform);
 *   const bgm = am.createAudio('music');
 *   bgm.load('bgm.mp3');
 *   bgm.play(true);
 *   am.setCategoryVolume('music', 0.5);
 *   am.muteCategory('sfx');
 */
export class AudioManager {
  private platform: IPlatform;
  private categories: Record<AudioCategory, AudioCategoryConfig>;
  private instances = new Set<ManagedAudio>();

  constructor(platform: IPlatform, config?: Partial<Record<AudioCategory, Partial<AudioCategoryConfig>>>) {
    this.platform = platform;
    this.categories = {
      music: { ...DEFAULT_CATEGORIES.music, ...config?.music },
      sfx: { ...DEFAULT_CATEGORIES.sfx, ...config?.sfx },
      voice: { ...DEFAULT_CATEGORIES.voice, ...config?.voice },
    };
  }

  /** 创建指定分类的音频实例。 */
  createAudio(category: AudioCategory = 'sfx'): ManagedAudio {
    return new ManagedAudio(this.platform, category, this);
  }

  /** 获取分类配置。 */
  getCategoryConfig(category: AudioCategory): AudioCategoryConfig {
    return this.categories[category];
  }

  /** 设置分类音量（0-1）。 */
  setCategoryVolume(category: AudioCategory, volume: number): void {
    this.categories[category].volume = Math.max(0, Math.min(1, volume));
    this.updateCategory(category);
  }

  /** 获取分类音量。 */
  getCategoryVolume(category: AudioCategory): number {
    return this.categories[category].volume;
  }

  /** 静音指定分类。 */
  muteCategory(category: AudioCategory): void {
    this.categories[category].muted = true;
    this.updateCategory(category);
  }

  /** 取消静音指定分类。 */
  unmuteCategory(category: AudioCategory): void {
    this.categories[category].muted = false;
    this.updateCategory(category);
  }

  /** 切换分类静音状态。 */
  toggleMute(category: AudioCategory): void {
    this.categories[category].muted = !this.categories[category].muted;
    this.updateCategory(category);
  }

  /** 分类是否静音。 */
  isCategoryMuted(category: AudioCategory): boolean {
    return this.categories[category].muted;
  }

  /** 全局静音所有分类。 */
  muteAll(): void {
    for (const cat of ['music', 'sfx', 'voice'] as AudioCategory[]) {
      this.categories[cat].muted = true;
    }
    this.updateAll();
  }

  /** 全局取消静音。 */
  unmuteAll(): void {
    for (const cat of ['music', 'music', 'voice'] as AudioCategory[]) {
      this.categories[cat].muted = false;
    }
    this.updateAll();
  }

  /** 更新指定分类的所有音频实例音量。 */
  private updateCategory(category: AudioCategory): void {
    for (const audio of this.instances) {
      if (audio.category === category) {
        audio.updateVolume();
      }
    }
  }

  /** 更新所有音频实例音量。 */
  private updateAll(): void {
    for (const audio of this.instances) {
      audio.updateVolume();
    }
  }

  /** 注册音频实例（内部使用）。 */
  register(audio: ManagedAudio): void {
    this.instances.add(audio);
  }

  /** 注销音频实例（内部使用）。 */
  unregister(audio: ManagedAudio): void {
    this.instances.delete(audio);
  }

  /** 销毁所有音频实例。 */
  destroyAll(): void {
    for (const audio of this.instances) {
      audio.ctx.destroy();
    }
    this.instances.clear();
  }

  /** 获取统计信息。 */
  getStats(): { total: number; byCategory: Record<AudioCategory, number> } {
    const byCategory: Record<AudioCategory, number> = { music: 0, sfx: 0, voice: 0 };
    for (const audio of this.instances) {
      byCategory[audio.category]++;
    }
    return { total: this.instances.size, byCategory };
  }
}
