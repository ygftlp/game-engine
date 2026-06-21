// 存储工具：通过Platform接口实现跨平台数据持久化。
import { IPlatform } from '../platform/Platform';
import { Logger } from './Logger';

const storageLogger = Logger.forModule('Storage');

export class Storage {
  private readonly indexKey: string;
  private prefix: string;
  private platform: IPlatform;

  constructor(platform: IPlatform, prefix = 'game_') {
    this.platform = platform;
    this.prefix = prefix;
    this.indexKey = `${this.prefix}__storage_index__`;
  }

  /** 保存数据。 */
  set(key: string, value: unknown): void {
    try {
      const fullKey = this.prefix + key;
      const json = JSON.stringify(value);
      this.platform.setStorage(fullKey, json);
      this.addToIndex(fullKey);
    } catch (e) {
      storageLogger.warning('set failed key=%s error=%o', key, e);
    }
  }

  /** 获取数据。 */
  get<T = unknown>(key: string, defaultValue?: T): T | undefined {
    try {
      const fullKey = this.prefix + key;
      const json = this.platform.getStorage(fullKey);
      if (json === null || json === undefined || json === '') {
        return defaultValue;
      }
      return JSON.parse(json) as T;
    } catch (e) {
      storageLogger.warning('get failed key=%s error=%o', key, e);
      return defaultValue;
    }
  }

  /** 检查key是否存在。 */
  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  /** 删除数据。 */
  remove(key: string): void {
    try {
      const fullKey = this.prefix + key;
      this.platform.removeStorage(fullKey);
      this.removeFromIndex(fullKey);
    } catch (e) {
      storageLogger.warning('remove failed key=%s error=%o', key, e);
    }
  }

  /** 清空所有数据。 */
  clear(): void {
    try {
      for (const key of this.getIndexedKeys()) {
        this.platform.removeStorage(key);
      }
      this.platform.removeStorage(this.indexKey);
    } catch (e) {
      storageLogger.warning('clear failed prefix=%s error=%o', this.prefix, e);
    }
  }

  private getIndexedKeys(): string[] {
    try {
      const raw = this.platform.getStorage(this.indexKey);
      if (!raw) return [];
      const keys = JSON.parse(raw) as unknown;
      if (!Array.isArray(keys)) return [];
      return keys.filter((key): key is string => typeof key === 'string' && key.startsWith(this.prefix));
    } catch {
      return [];
    }
  }

  private saveIndex(keys: string[]): void {
    if (keys.length === 0) {
      this.platform.removeStorage(this.indexKey);
      return;
    }
    this.platform.setStorage(this.indexKey, JSON.stringify(keys));
  }

  private addToIndex(fullKey: string): void {
    const keys = this.getIndexedKeys();
    if (!keys.includes(fullKey)) {
      keys.push(fullKey);
      this.saveIndex(keys);
    }
  }

  private removeFromIndex(fullKey: string): void {
    const keys = this.getIndexedKeys().filter((key) => key !== fullKey);
    this.saveIndex(keys);
  }
}
