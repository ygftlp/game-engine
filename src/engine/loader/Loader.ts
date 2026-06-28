// 资源管理：图片、音频、JSON 的异步加载与缓存。
import { IPlatform } from '../platform/Platform';
import { Texture } from '../render/Texture';
import { Audio } from '../audio/Audio';
import { Logger } from '../utils/Logger';

export type ResourceType = 'texture' | 'audio' | 'json';

export interface ResourceDescriptor {
  url: string;
  type: ResourceType;
}

interface ResourceFailure {
  resource: ResourceDescriptor;
  reason: unknown;
}

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
      img.onerror = (err) => reject(new Error(`Texture load failed: ${url}; reason=${this.formatError(err)}`));
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
    if (this.jsonCache.has(url)) return this.jsonCache.get(url);
    const log = Logger.forModule('Network');
    log.debug('requestJSON start url=%s', url);
    try {
      const data = await this.platform.requestJSON(url);
      this.jsonCache.set(url, data);
      log.debug('requestJSON success url=%s', url);
      return data;
    } catch (err) {
      log.error('requestJSON failed url=%s error=%o', url, err);
      throw new Error(`JSON load failed: ${url}; reason=${this.formatError(err)}`);
    }
  }

  async loadAll(resources: ResourceDescriptor[]): Promise<void> {
    const failed: ResourceFailure[] = [];

    await Promise.all(
      resources.map(async (resource) => {
        try {
          await this.loadResource(resource);
        } catch (reason) {
          failed.push({ resource, reason });
        }
      })
    );

    if (failed.length > 0) {
      const details = failed
        .map(({ resource, reason }) => `${resource.type}:${resource.url} -> ${this.formatError(reason)}`)
        .join('; ');
      throw new Error(`${failed.length} resource(s) failed: ${details}`);
    }
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

  private async loadResource(resource: ResourceDescriptor): Promise<void> {
    if (resource.type === 'texture') {
      await this.loadTexture(resource.url);
      return;
    }
    if (resource.type === 'audio') {
      this.loadAudio(resource.url);
      return;
    }
    await this.loadJSON(resource.url);
  }

  private formatError(err: unknown): string {
    if (err instanceof Error) return err.message;
    if (typeof err === 'string') return err;
    try {
      return JSON.stringify(err);
    } catch {
      return String(err);
    }
  }
}
