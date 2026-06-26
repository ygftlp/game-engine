// 音频精灵：从单个音频文件中定义多个播放区域，高效管理短音效。

/** 音频精灵帧 */
export interface AudioSpriteFrame {
  /** 起始时间（秒） */
  start: number;
  /** 结束时间（秒） */
  end: number;
  /** 音量倍率 */
  volume?: number;
  /** 是否循环此区域 */
  loop?: boolean;
}

/**
 * 音频精灵：从一个音频文件中播放不同区域。
 *
 * 使用示例：
 *   const sprite = new AudioSprite(audioElement, {
 *     'explosion': { start: 0, end: 1.5 },
 *     'hit': { start: 2, end: 2.5 },
 *     'jump': { start: 3, end: 3.3 },
 *   });
 *   sprite.play('explosion');
 *   sprite.play('hit');
 */
export class AudioSprite {
  private audio: any;
  private sprites: Map<string, AudioSpriteFrame>;
  private currentSprite: string | null = null;
  private isPlaying = false;

  constructor(audio: HTMLAudioElement | any, sprites: Record<string, AudioSpriteFrame>) {
    if (typeof HTMLAudioElement === 'undefined') {
      throw new Error('AudioSprite requires HTMLAudioElement (H5 platform only)');
    }
    this.audio = audio;
    this.sprites = new Map(Object.entries(sprites));

    // 监听时间更新
    this.audio.addEventListener('timeupdate', () => this.onTimeUpdate());
    this.audio.addEventListener('ended', () => this.onEnded());
  }

  /** 播放指定精灵 */
  play(name: string, volume = 1): void {
    const frame = this.sprites.get(name);
    if (!frame) return;

    this.currentSprite = name;
    this.isPlaying = true;

    this.audio.currentTime = frame.start;
    this.audio.volume = (frame.volume ?? 1) * volume;
    this.audio.loop = frame.loop ?? false;
    this.audio.play();
  }

  /** 停止播放 */
  stop(): void {
    this.audio.pause();
    this.audio.currentTime = 0;
    this.isPlaying = false;
    this.currentSprite = null;
  }

  /** 暂停 */
  pause(): void {
    this.audio.pause();
    this.isPlaying = false;
  }

  /** 恢复 */
  resume(): void {
    if (this.currentSprite) {
      this.audio.play();
      this.isPlaying = true;
    }
  }

  /** 添加精灵定义 */
  addSprite(name: string, frame: AudioSpriteFrame): void {
    this.sprites.set(name, frame);
  }

  /** 移除精灵定义 */
  removeSprite(name: string): void {
    this.sprites.delete(name);
  }

  /** 获取精灵定义 */
  getSprite(name: string): AudioSpriteFrame | undefined {
    return this.sprites.get(name);
  }

  /** 获取所有精灵名称 */
  getSpriteNames(): string[] {
    return Array.from(this.sprites.keys());
  }

  /** 是否正在播放 */
  getPlaying(): boolean {
    return this.isPlaying;
  }

  /** 获取当前播放的精灵名 */
  getCurrentSprite(): string | null {
    return this.currentSprite;
  }

  /** 设置音量 */
  set volume(v: number) {
    this.audio.volume = v;
  }

  get volume(): number {
    return this.audio.volume;
  }

  private onTimeUpdate(): void {
    if (!this.currentSprite || !this.isPlaying) return;

    const frame = this.sprites.get(this.currentSprite);
    if (!frame) return;

    // 超出精灵范围时停止（非循环模式）
    if (!frame.loop && this.audio.currentTime >= frame.end) {
      this.audio.currentTime = frame.start;
      this.isPlaying = false;
      this.currentSprite = null;
    }
  }

  private onEnded(): void {
    this.isPlaying = false;
    this.currentSprite = null;
  }
}

/**
 * 音频精灵管理器：管理多个音频精灵实例。
 */
export class AudioSpriteManager {
  private sprites = new Map<string, AudioSprite>();

  /** 创建音频精灵 */
  create(name: string, audio: HTMLAudioElement | any, frames: Record<string, AudioSpriteFrame>): AudioSprite {
    if (typeof HTMLAudioElement === 'undefined') {
      throw new Error('AudioSpriteManager requires HTMLAudioElement (H5 platform only)');
    }
    const sprite = new AudioSprite(audio, frames);
    this.sprites.set(name, sprite);
    return sprite;
  }

  /** 获取音频精灵 */
  get(name: string): AudioSprite | undefined {
    return this.sprites.get(name);
  }

  /** 移除音频精灵 */
  remove(name: string): void {
    const sprite = this.sprites.get(name);
    if (sprite) {
      sprite.stop();
      this.sprites.delete(name);
    }
  }

  /** 停止所有精灵 */
  stopAll(): void {
    for (const sprite of this.sprites.values()) {
      sprite.stop();
    }
  }

  /** 获取统计信息 */
  getStats(): { total: number; playing: number } {
    let playing = 0;
    for (const sprite of this.sprites.values()) {
      if (sprite.getPlaying()) playing++;
    }
    return { total: this.sprites.size, playing };
  }
}
