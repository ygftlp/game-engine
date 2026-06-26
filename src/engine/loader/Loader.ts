// 资源管理：图片、音频、JSON 的异步加载与缓存。
import { IPlatform } from '../platform/Platform';
import { Texture } from '../render/Texture';
import { Audio } from '../audio/Audio';

export class Loader {
  private textureCache = new Map<string, Texture>();
  private jsonCache = new Map<string, unknown>();
  private audioCache = new Map<string, Audio>();

  constructor(private platform: IPlatform) {}

  loadTexture(url: string): Promise<Texture> {
    const cached = this.textureCache.get(url);
    if (cached) return Promise.resolve(cached);
    return new Promise((resolve, reject) => {
      const img = this.platform.createImage();
      img.onload = () => {
        const tex = new Texture(img);
        this.textureCache.set(url, tex);
        resolve(tex);
      };
      img.onerror = (err) => reject(err);
      img.src = url;
    });
  }

  loadAudio(url: string): Audio {
    const cached = this.audioCache.get(url);
    if (cached) return cached;
    const audio = new Audio(this.platform);
    audio.load(url);
    this.audioCache.set(url, audio);
    return audio;
  }

  async loadJSON(url: string): Promise<unknown> {
    const cached = this.jsonCache.get(url);
    if (cached) return cached;
    const data = await this.platform.requestJSON(url);
    this.jsonCache.set(url, data);
    return data;
  }

  unloadTexture(url: string): void {
    const tex = this.textureCache.get(url);
    if (tex) {
      tex.dispose();
      this.textureCache.delete(url);
    }
  }

  unloadAudio(url: string): void {
    const audio = this.audioCache.get(url);
    if (audio) {
      audio.destroy();
      this.audioCache.delete(url);
    }
  }

  unloadJSON(url: string): void {
    this.jsonCache.delete(url);
  }

  clearCache(): void {
    for (const tex of this.textureCache.values()) {
      tex.dispose();
    }
    this.textureCache.clear();
    for (const audio of this.audioCache.values()) {
      audio.destroy();
    }
    this.audioCache.clear();
    this.jsonCache.clear();
  }

  getCacheStats(): { textures: number; audios: number; jsons: number } {
    return {
      textures: this.textureCache.size,
      audios: this.audioCache.size,
      jsons: this.jsonCache.size,
    };
  }
}
