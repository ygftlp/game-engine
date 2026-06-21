// 动画剪辑：支持图集帧和独立图片两种模式。
import { TextureFrame, Texture } from './Texture';

export type AnimationClipMode = 'once' | 'loop';

/** 动画帧：可以是图集帧(TextureFrame)或独立纹理(Texture) */
export type AnimationFrame = TextureFrame | Texture;

export interface AnimationClipConfig {
  /** 帧序列 */
  frames: AnimationFrame[];
  /** 帧率（每秒帧数），默认 12 */
  fps?: number;
  /** 播放模式：once 播完停止，loop 循环播放，默认 loop */
  mode?: AnimationClipMode;
  /** 动画名称（用于 Animator 按名播放） */
  name?: string;
}

export class AnimationClip {
  readonly frames: AnimationFrame[];
  readonly fps: number;
  readonly mode: AnimationClipMode;
  readonly name: string;

  /** 单帧时长（秒） */
  readonly frameDuration: number;
  /** 总时长（秒） */
  readonly totalDuration: number;

  constructor(config: AnimationClipConfig) {
    this.frames = config.frames;
    this.fps = config.fps ?? 12;
    this.mode = config.mode ?? 'loop';
    this.name = config.name ?? '';
    this.frameDuration = 1 / this.fps;
    this.totalDuration = this.frames.length * this.frameDuration;
  }

  /** 根据时间（秒）返回当前帧索引 */
  getFrameIndex(time: number): number {
    if (this.frames.length === 0) return 0;
    if (this.mode === 'once') {
      if (time >= this.totalDuration) return this.frames.length - 1;
      return Math.floor(time / this.frameDuration);
    }
    // loop 模式
    const t = time % this.totalDuration;
    return Math.floor(t / this.frameDuration);
  }

  /** 根据时间返回当前帧 */
  getFrame(time: number): AnimationFrame | null {
    if (this.frames.length === 0) return null;
    return this.frames[this.getFrameIndex(time)];
  }

  /** 动画是否已播放完毕（仅 once 模式有效） */
  isFinished(time: number): boolean {
    return this.mode === 'once' && time >= this.totalDuration;
  }

  /** 判断帧是否为Texture类型（独立图片） */
  static isTextureFrame(frame: AnimationFrame): frame is TextureFrame {
    return 'x' in frame && 'y' in frame && 'width' in frame && 'height' in frame;
  }

  /** 判断帧是否为Texture类型（独立图片） */
  static isTexture(frame: AnimationFrame): frame is Texture {
    return 'image' in frame && 'loaded' in frame;
  }
}

// 便捷工厂方法

/** 创建图集动画剪辑 */
export function createAtlasAnimationClip(
  name: string,
  texture: Texture,
  frameWidth: number,
  frameHeight: number,
  frameCount: number,
  fps: number = 12,
  mode: AnimationClipMode = 'loop'
): AnimationClip {
  const frames: TextureFrame[] = [];
  const cols = Math.floor(texture.width / frameWidth);
  
  for (let i = 0; i < frameCount; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    frames.push({
      x: col * frameWidth,
      y: row * frameHeight,
      width: frameWidth,
      height: frameHeight,
    });
  }
  
  return new AnimationClip({ name, frames, fps, mode });
}

/** 创建图片序列动画剪辑 */
export function createImageSequenceClip(
  name: string,
  textures: Texture[],
  fps: number = 12,
  mode: AnimationClipMode = 'loop'
): AnimationClip {
  return new AnimationClip({ name, frames: textures, fps, mode });
}