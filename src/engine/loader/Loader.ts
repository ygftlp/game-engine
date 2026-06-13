// 资源管理：图片、音频、JSON 的异步加载与缓存。
import { IPlatform } from '../platform/Platform';
import { Texture } from '../render/Texture';
import { Audio } from '../audio/Audio';

export class Loader {
  private textureCache = new Map<string, Texture>();
  private jsonCache = new Map<string, unknown>();

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
    const audio = new Audio(this.platform);
    audio.load(url);
    return audio;
  }

  async loadJSON(url: string): Promise<unknown> {
    const cached = this.jsonCache.get(url);
    if (cached) return cached;
    const data = await this.platform.requestJSON(url);
    this.jsonCache.set(url, data);
    return data;
  }
}
