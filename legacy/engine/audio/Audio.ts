// 音频：封装平台 InnerAudioContext，提供播放/暂停/停止/音量控制。
import { IPlatform, IAudio } from '../platform/Platform';

export class Audio {
  private ctx: IAudio;

  constructor(platform: IPlatform) {
    this.ctx = platform.createAudio();
  }

  load(url: string): void {
    this.ctx.src = url;
  }

  play(loop = false): void {
    this.ctx.loop = loop;
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

  destroy(): void {
    this.ctx.destroy();
  }
}
