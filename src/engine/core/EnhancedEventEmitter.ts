// 增强事件系统：支持优先级、命名空间、类型安全、条件监听、事件拦截。

/** 事件监听器选项 */
export interface EventListenerOptions {
  /** 优先级（数字越大越先执行） */
  priority?: number;
  /** 命名空间（用于批量操作） */
  namespace?: string;
  /** 上下文绑定 */
  context?: unknown;
  /** 条件监听（满足条件时自动移除） */
  condition?: () => boolean;
  /** 最大触发次数（0=无限） */
  maxTimes?: number;
  /** 是否在下一次触发后自动移除 */
  once?: boolean;
}

/** 增强事件监听器 */
export interface EnhancedEventListener {
  /** 原始回调 */
  callback: (...args: unknown[]) => void;
  /** 监听器选项 */
  options: Required<EventListenerOptions>;
  /** 已触发次数 */
  triggeredCount: number;
  /** 注册时间 */
  registeredAt: number;
  /** 是否已禁用 */
  disabled: boolean;
}

/** 事件拦截器 */
export interface EventInterceptor {
  /** 事件名（* 表示拦截所有） */
  event: string;
  /** 拦截回调，返回 false 阻止后续监听器执行 */
  callback: (event: string, args: unknown[]) => boolean;
  /** 优先级 */
  priority?: number;
}

/**
 * 增强事件发射器
 */
export class EnhancedEventEmitter {
  private listeners = new Map<string, EnhancedEventListener[]>();
  private interceptors: EventInterceptor[] = [];
  private eventHistory: Array<{ event: string; args: unknown[]; timestamp: number }> = [];
  private maxHistorySize = 100;
  private emitDepth = 0;

  /**
   * 注册事件监听器
   */
  on(event: string, callback: (...args: unknown[]) => void, options?: EventListenerOptions): () => void {
    const listener: EnhancedEventListener = {
      callback,
      options: {
        priority: options?.priority ?? 0,
        namespace: options?.namespace ?? '',
        context: options?.context ?? null,
        condition: options?.condition ?? (() => true),
        maxTimes: options?.maxTimes ?? 0,
        once: options?.once ?? false,
      },
      triggeredCount: 0,
      registeredAt: Date.now(),
      disabled: false,
    };

    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }

    const list = this.listeners.get(event)!;
    list.push(listener);

    // 按优先级排序
    list.sort((a, b) => b.options.priority - a.options.priority);

    // 返回取消函数
    return () => this.off(event, callback);
  }

  /**
   * 注册一次性监听器
   */
  once(event: string, callback: (...args: unknown[]) => void, options?: EventListenerOptions): () => void {
    return this.on(event, callback, { ...options, once: true });
  }

  /**
   * 注册条件监听器（条件不满足时自动移除）
   */
  onCondition(event: string, callback: (...args: unknown[]) => void, condition: () => boolean): () => void {
    return this.on(event, callback, { condition });
  }

  /**
   * 注册命名空间监听器
   */
  onNamespace(namespace: string, event: string, callback: (...args: unknown[]) => void): () => void {
    return this.on(event, callback, { namespace });
  }

  /**
   * 移除监听器
   */
  off(event: string, callback?: (...args: unknown[]) => void): this {
    const list = this.listeners.get(event);
    if (!list) return this;

    if (callback) {
      const idx = list.findIndex(l => l.callback === callback);
      if (idx >= 0) list.splice(idx, 1);
    } else {
      list.length = 0;
    }

    if (list.length === 0) {
      this.listeners.delete(event);
    }

    return this;
  }

  /**
   * 移除命名空间下的所有监听器
   */
  offNamespace(namespace: string): this {
    for (const [event, list] of this.listeners) {
      const filtered = list.filter(l => l.options.namespace !== namespace);
      if (filtered.length === 0) {
        this.listeners.delete(event);
      } else {
        this.listeners.set(event, filtered);
      }
    }
    return this;
  }

  /**
   * 移除指定事件的所有监听器
   */
  offAll(event: string): this {
    this.listeners.delete(event);
    return this;
  }

  /**
   * 清除所有监听器
   */
  clear(): this {
    this.listeners.clear();
    this.interceptors.length = 0;
    return this;
  }

  /**
   * 添加事件拦截器
   */
  addInterceptor(interceptor: EventInterceptor): () => void {
    this.interceptors.push(interceptor);
    this.interceptors.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

    return () => {
      const idx = this.interceptors.indexOf(interceptor);
      if (idx >= 0) this.interceptors.splice(idx, 1);
    };
  }

  /**
   * 移除事件拦截器
   */
  removeInterceptor(interceptor: EventInterceptor): void {
    const idx = this.interceptors.indexOf(interceptor);
    if (idx >= 0) this.interceptors.splice(idx, 1);
  }

  /**
   * 触发事件
   */
  emit(event: string, ...args: unknown[]): boolean {
    this.emitDepth++;

    // 记录历史
    if (this.eventHistory.length >= this.maxHistorySize) {
      this.eventHistory.shift();
    }
    this.eventHistory.push({ event, args, timestamp: Date.now() });

    // 检查拦截器
    for (const interceptor of this.interceptors) {
      if (interceptor.event === '*' || interceptor.event === event) {
        if (interceptor.callback(event, args) === false) {
          this.emitDepth--;
          return false;
        }
      }
    }

    // 执行监听器
    const list = this.listeners.get(event);
    if (list) {
      const toRemove: EnhancedEventListener[] = [];

      for (const listener of list) {
        if (listener.disabled) continue;

        // 检查条件
        if (!listener.options.condition()) {
          toRemove.push(listener);
          continue;
        }

        // 执行回调
        listener.callback.call(listener.options.context, ...args);
        listener.triggeredCount++;

        // 检查最大触发次数
        if (listener.options.maxTimes > 0 && listener.triggeredCount >= listener.options.maxTimes) {
          toRemove.push(listener);
        }

        // 一次性监听器
        if (listener.options.once) {
          toRemove.push(listener);
        }
      }

      // 移除需要清理的监听器
      for (const listener of toRemove) {
        const idx = list.indexOf(listener);
        if (idx >= 0) list.splice(idx, 1);
      }

      if (list.length === 0) {
        this.listeners.delete(event);
      }
    }

    this.emitDepth--;
    return true;
  }

  /**
   * 异步触发事件（等待所有监听器完成）
   */
  async emitAsync(event: string, ...args: unknown[]): Promise<boolean> {
    this.emitDepth++;

    // 检查拦截器
    for (const interceptor of this.interceptors) {
      if (interceptor.event === '*' || interceptor.event === event) {
        if (interceptor.callback(event, args) === false) {
          this.emitDepth--;
          return false;
        }
      }
    }

    // 执行监听器
    const list = this.listeners.get(event);
    if (list) {
      const toRemove: EnhancedEventListener[] = [];

      for (const listener of list) {
        if (listener.disabled) continue;

        if (!listener.options.condition()) {
          toRemove.push(listener);
          continue;
        }

        const result = listener.callback.call(listener.options.context, ...args);
        if (typeof result === 'object' && result !== null && typeof (result as any).then === 'function') {
          await result;
        }

        listener.triggeredCount++;

        if (listener.options.maxTimes > 0 && listener.triggeredCount >= listener.options.maxTimes) {
          toRemove.push(listener);
        }

        if (listener.options.once) {
          toRemove.push(listener);
        }
      }

      for (const listener of toRemove) {
        const idx = list.indexOf(listener);
        if (idx >= 0) list.splice(idx, 1);
      }

      if (list.length === 0) {
        this.listeners.delete(event);
      }
    }

    this.emitDepth--;
    return true;
  }

  /**
   * 获取指定事件的监听器数量
   */
  listenerCount(event: string): number {
    return this.listeners.get(event)?.length ?? 0;
  }

  /**
   * 检查是否有指定事件的监听器
   */
  hasListeners(event: string): boolean {
    return this.listenerCount(event) > 0;
  }

  /**
   * 获取事件历史
   */
  getHistory(event?: string): Array<{ event: string; args: unknown[]; timestamp: number }> {
    if (event) {
      return this.eventHistory.filter(h => h.event === event);
    }
    return [...this.eventHistory];
  }

  /**
   * 清除事件历史
   */
  clearHistory(): void {
    this.eventHistory.length = 0;
  }

  /**
   * 禁用/启用监听器
   */
  setListenerDisabled(event: string, callback: (...args: unknown[]) => void, disabled: boolean): void {
    const list = this.listeners.get(event);
    if (list) {
      const listener = list.find(l => l.callback === callback);
      if (listener) {
        listener.disabled = disabled;
      }
    }
  }

  /**
   * 获取所有已注册的事件名
   */
  getEventNames(): string[] {
    return Array.from(this.listeners.keys());
  }

  /**
   * 是否正在触发事件
   */
  isEmitting(): boolean {
    return this.emitDepth > 0;
  }
}

// ========== 类型安全的事件映射 ==========

/**
 * 类型安全的事件发射器
 * 
 * 使用示例：
 *   interface GameEvents {
 *     'player:hit': [damage: number, source: string];
 *     'player:die': [];
 *     'score:change': [newScore: number];
 *   }
 * 
 *   const emitter = new TypedEventEmitter<GameEvents>();
 *   emitter.on('player:hit', (damage, source) => { ... });
 *   emitter.emit('player:hit', 100, 'enemy');
 */
export class TypedEventEmitter<T extends Record<string, unknown[]>> {
  private emitter = new EnhancedEventEmitter();

  on<K extends keyof T>(event: K, callback: (...args: T[K]) => void, options?: EventListenerOptions): () => void {
    return this.emitter.on(event as string, callback as (...args: unknown[]) => void, options);
  }

  once<K extends keyof T>(event: K, callback: (...args: T[K]) => void, options?: EventListenerOptions): () => void {
    return this.emitter.once(event as string, callback as (...args: unknown[]) => void, options);
  }

  off<K extends keyof T>(event: K, callback?: (...args: T[K]) => void): this {
    this.emitter.off(event as string, callback as (...args: unknown[]) => void);
    return this;
  }

  emit<K extends keyof T>(event: K, ...args: T[K]): boolean {
    return this.emitter.emit(event as string, ...args);
  }

  async emitAsync<K extends keyof T>(event: K, ...args: T[K]): Promise<boolean> {
    return this.emitter.emitAsync(event as string, ...args);
  }

  listenerCount<K extends keyof T>(event: K): number {
    return this.emitter.listenerCount(event as string);
  }

  hasListeners<K extends keyof T>(event: K): boolean {
    return this.emitter.hasListeners(event as string);
  }

  clear(): this {
    this.emitter.clear();
    return this;
  }
}
