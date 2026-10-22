// 对象池：复用对象实例，减少 GC 压力。
export class Pool<T> {
  private pool: T[] = [];
  private factory: () => T;
  private reset: (obj: T) => void;
  private maxSize: number;

  /**
   * @param factory 创建新对象的工厂函数。
   * @param reset 重置对象状态的函数（归还时调用）。
   * @param maxSize 池的最大容量（0 表示不限制）。
   * @param initialSize 初始预分配数量。
   */
  constructor(
    factory: () => T,
    reset: (obj: T) => void,
    maxSize: number = 0,
    initialSize: number = 0
  ) {
    this.factory = factory;
    this.reset = reset;
    this.maxSize = maxSize;
    for (let i = 0; i < initialSize; i++) {
      if (this.maxSize > 0 && this.pool.length >= this.maxSize) break;
      this.pool.push(factory());
    }
  }

  /** 从池中获取对象（池空则创建新实例）。 */
  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.factory();
  }

  /** 归还对象到池中。 */
  release(obj: T): void {
    this.reset(obj);
    if (this.maxSize <= 0 || this.pool.length < this.maxSize) {
      this.pool.push(obj);
    }
  }

  /** 预热池：创建指定数量的对象并放入池中。 */
  warmUp(count: number): void {
    for (let i = 0; i < count; i++) {
      if (this.maxSize > 0 && this.pool.length >= this.maxSize) break;
      this.pool.push(this.factory());
    }
  }

  /** 清空池。 */
  clear(): void {
    for (const obj of this.pool) {
      this.reset(obj);
    }
    this.pool.length = 0;
  }

  /** 当前池中对象数量。 */
  get size(): number {
    return this.pool.length;
  }
}