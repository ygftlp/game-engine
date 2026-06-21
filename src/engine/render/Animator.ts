// 动画控制器组件：驱动 Sprite 播放 AnimationClip，支持图集帧和独立图片。
import { Component } from '../core/Component';
import { Sprite } from './Sprite';
import { AnimationClip } from './AnimationClip';
import { Logger } from '../utils/Logger';

const animatorLogger = Logger.forModule('Animator');

export class Animator extends Component {
  private clips = new Map<string, AnimationClip>();
  private currentClip: AnimationClip | null = null;
  private currentTime = 0;
  private playing = false;
  private warnedNotSprite = false;

  /** 添加动画剪辑。 */
  addClip(clip: AnimationClip): void {
    if (clip.name) {
      this.clips.set(clip.name, clip);
    }
  }

  /** 移除动画剪辑。 */
  removeClip(name: string): void {
    this.clips.delete(name);
  }

  /** 按名称获取剪辑。 */
  getClip(name: string): AnimationClip | undefined {
    return this.clips.get(name);
  }

  /** 获取所有剪辑名称。 */
  getClipNames(): string[] {
    return Array.from(this.clips.keys());
  }

  /** 播放指定名称的动画。 */
  play(name: string, restart: boolean = false): void {
    const clip = this.clips.get(name);
    if (!clip) {
      animatorLogger.warning('clip "%s" not found', name);
      return;
    }
    if (this.currentClip === clip && this.playing && !restart) return;
    this.currentClip = clip;
    this.currentTime = 0;
    this.playing = true;
    this.applyFrame();
  }

  /** 暂停当前动画。 */
  pause(): void {
    this.playing = false;
  }

  /** 恢复播放。 */
  resume(): void {
    if (this.currentClip) this.playing = true;
  }

  /** 停止并重置。 */
  stop(): void {
    this.playing = false;
    this.currentTime = 0;
  }

  /** 当前是否正在播放。 */
  isPlaying(): boolean {
    return this.playing;
  }

  /** 当前剪辑是否已播放完毕（仅 once 模式）。 */
  isFinished(): boolean {
    if (!this.currentClip) return false;
    return this.currentClip.isFinished(this.currentTime);
  }

  /** 获取当前剪辑名称。 */
  getCurrentClipName(): string | null {
    return this.currentClip?.name ?? null;
  }

  override onUpdate(dt: number): void {
    if (!this.playing || !this.currentClip) return;

    this.currentTime += dt;

    // once 模式播完自动停止
    if (this.currentClip.mode === 'once' && this.currentTime >= this.currentClip.totalDuration) {
      this.currentTime = this.currentClip.totalDuration;
      this.playing = false;
    }

    this.applyFrame();
  }

  private applyFrame(): void {
    if (!this.currentClip || !this.node) return;
    if (!(this.node instanceof Sprite)) {
      if (!this.warnedNotSprite) {
        animatorLogger.warning('component must be attached to a Sprite node');
        this.warnedNotSprite = true;
      }
      return;
    }

    const frame = this.currentClip.getFrame(this.currentTime);
    if (!frame) return;

    // 判断帧类型
    if (AnimationClip.isTexture(frame)) {
      // 独立图片模式：更新整个纹理
      this.node.setTexture(frame);
    } else {
      // 图集帧模式：更新帧区域
      this.node.setFrame(frame);
    }
  }
}