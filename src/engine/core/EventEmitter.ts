// 全局事件发射器：支持 on/off/emit/once，用于模块间解耦通信。
export type EventListener = (...args: unknown[]) => void;

export class EventEmitter {
  private listeners = new Map<string, Set<EventListener>>();
  private onceListeners = new Map<string, Set<EventListener>>();

  /** 注册事件监听器。 */
  on(event: string, listener: EventListener): this {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(listener);
    return this;
  }

  /** 注册一次性事件监听器（触发后自动移除）。 */
  once(event: string, listener: EventListener): this {
    let set = this.onceListeners.get(event);
    if (!set) {
      set = new Set();
      this.onceListeners.set(event, set);
    }
    set.add(listener);
    return this;
  }

  /** 移除事件监听器。 */
  off(event: string, listener: EventListener): this {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(listener);
      if (set.size === 0) this.listeners.delete(event);
    }
    const onceSet = this.onceListeners.get(event);
    if (onceSet) {
      onceSet.delete(listener);
      if (onceSet.size === 0) this.onceListeners.delete(event);
    }
    return this;
  }

  /** 移除指定事件的所有监听器。 */
  offAll(event: string): this {
    this.listeners.delete(event);
    this.onceListeners.delete(event);
    return this;
  }

  /** 移除所有事件的所有监听器。 */
  clear(): this {
    this.listeners.clear();
    this.onceListeners.clear();
    return this;
  }

  /** 触发事件。 */
  emit(event: string, ...args: unknown[]): this {
    const set = this.listeners.get(event);
    if (set && set.size > 0) {
      const snapshot = [...set];
      for (const listener of snapshot) {
        listener(...args);
      }
    }
    const onceSet = this.onceListeners.get(event);
    if (onceSet && onceSet.size > 0) {
      const snapshot = [...onceSet];
      this.onceListeners.delete(event);
      for (const listener of snapshot) {
        listener(...args);
      }
    }
    return this;
  }

  /** 获取指定事件的监听器数量。 */
  listenerCount(event: string): number {
    const count = this.listeners.get(event)?.size ?? 0;
    const onceCount = this.onceListeners.get(event)?.size ?? 0;
    return count + onceCount;
  }

  /** 检查是否有指定事件的监听器。 */
  hasListeners(event: string): boolean {
    return this.listenerCount(event) > 0;
  }
}