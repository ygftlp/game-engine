// LRU缓存：带容量上限的缓存，超出时自动淘汰最久未使用的项。
export class LRUCache<K, V> {
  private cache = new Map<K, V>();
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  /** 获取缓存项，访问后移到最新位置 */
  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // 移到最新位置
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  /** 设置缓存项 */
  set(key: K, value: V): void {
    // 如果已存在，先删除
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    // 如果达到上限，删除最旧的项
    else if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    // 添加新项
    this.cache.set(key, value);
  }

  /** 检查是否存在 */
  has(key: K): boolean {
    return this.cache.has(key);
  }

  /** 删除缓存项 */
  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  /** 清空缓存 */
  clear(): void {
    this.cache.clear();
  }

  /** 获取缓存大小 */
  get size(): number {
    return this.cache.size;
  }

  /** 获取所有键 */
  keys(): IterableIterator<K> {
    return this.cache.keys();
  }

  /** 获取所有值 */
  values(): IterableIterator<V> {
    return this.cache.values();
  }

  /** 获取所有键值对 */
  entries(): IterableIterator<[K, V]> {
    return this.cache.entries();
  }

  /** 设置最大容量 */
  setMaxSize(maxSize: number): void {
    this.maxSize = maxSize;
    // 如果当前大小超过新上限，淘汰多余的项
    while (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
  }

  /** 获取最大容量 */
  getMaxSize(): number {
    return this.maxSize;
  }

  /** 获取缓存使用率（0-1） */
  getUsageRate(): number {
    return this.cache.size / this.maxSize;
  }
}