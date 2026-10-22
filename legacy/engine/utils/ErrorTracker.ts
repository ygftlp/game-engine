// 错误追踪系统：全局错误捕获、错误上报、崩溃日志、性能分析。

import { EventEmitter } from '../core/EventEmitter';

/** 错误类型 */
export type ErrorType = 'js_error' | 'promise_rejection' | 'resource_error' | 'canvas_error' | 'network_error' | 'platform_error' | 'custom';

/** 错误严重级别 */
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

/** 错误信息 */
export interface ErrorInfo {
  /** 错误类型 */
  type: ErrorType;
  /** 错误消息 */
  message: string;
  /** 错误堆栈 */
  stack?: string;
  /** 错误来源 */
  source?: string;
  /** 行号 */
  line?: number;
  /** 列号 */
  column?: number;
  /** 错误 URL */
  url?: string;
  /** 严重级别 */
  severity: ErrorSeverity;
  /** 设备信息 */
  device?: {
    platform: string;
    system: string;
    model: string;
  };
  /** 用户信息 */
  user?: {
    userId?: string;
    sessionId: string;
  };
  /** 额外数据 */
  extra?: Record<string, unknown>;
  /** 时间戳 */
  timestamp: number;
}

/** 错误配置 */
export interface ErrorTrackerConfig {
  /** 是否启用 */
  enabled: boolean;
  /** 上报 URL */
  reportUrl?: string;
  /** 上报间隔（毫秒） */
  reportInterval: number;
  /** 最大缓冲大小 */
  maxBufferSize: number;
  /** 是否捕获资源加载错误 */
  captureResourceErrors: boolean;
  /** 是否捕获未处理的 Promise 拒绝 */
  capturePromiseRejections: boolean;
  /** 是否自动上报 */
  autoReport: boolean;
  /** 自定义过滤器 */
  filter?: (error: ErrorInfo) => boolean;
  /** 自定义处理器 */
  handler?: (error: ErrorInfo) => void;
}

const DEFAULT_CONFIG: ErrorTrackerConfig = {
  enabled: true,
  reportInterval: 10000,
  maxBufferSize: 100,
  captureResourceErrors: true,
  capturePromiseRejections: true,
  autoReport: true,
};

/**
 * 错误追踪器
 * 
 * 使用示例：
 *   const tracker = new ErrorTracker(platform);
 *   tracker.start();
 *   
 *   // 监听错误
 *   tracker.onError((error) => {
 *     console.error('错误:', error.message);
 *   });
 *   
 *   // 自定义错误
 *   tracker.captureError(new Error('自定义错误'), 'game_logic');
 *   
 *   // 添加面包屑
 *   tracker.addBreadcrumb('玩家点击了开始按钮');
 */
export class ErrorTracker extends EventEmitter {
  private config: ErrorTrackerConfig;
  private platform: any;
  private buffer: ErrorInfo[] = [];
  private reportTimer: ReturnType<typeof setInterval> | null = null;
  private sessionId: string;
  private userId: string | null = null;
  private breadcrumbs: Array<{ message: string; timestamp: number; category: string }> = [];
  private maxBreadcrumbs = 50;

  // 原始错误处理器
  private originalErrorHandler: OnErrorEventHandler | null = null;
  private originalUnhandledRejection: ((event: PromiseRejectionEvent) => void) | null = null;

  constructor(platform?: any, config?: Partial<ErrorTrackerConfig>) {
    super();
    this.platform = platform;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.sessionId = this.generateSessionId();
  }

  /** 启动错误追踪 */
  start(): void {
    if (!this.config.enabled) return;

    // 捕获全局错误
    this.installGlobalHandlers();

    // 启动自动上报
    if (this.config.autoReport) {
      this.reportTimer = setInterval(() => this.flush(), this.config.reportInterval);
    }
  }

  /** 停止错误追踪 */
  stop(): void {
    this.restoreGlobalHandlers();
    if (this.reportTimer) {
      clearInterval(this.reportTimer);
      this.reportTimer = null;
    }
  }

  /** 设置用户 ID */
  setUserId(userId: string): void {
    this.userId = userId;
  }

  /** 捕获错误 */
  captureError(error: Error | string, source?: string, extra?: Record<string, unknown>): void {
    const errorInfo: ErrorInfo = {
      type: 'custom',
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'object' ? error.stack : undefined,
      source,
      severity: 'high',
      device: this.getDeviceInfo(),
      user: {
        userId: this.userId ?? undefined,
        sessionId: this.sessionId,
      },
      extra,
      timestamp: Date.now(),
    };

    this.handleError(errorInfo);
  }

  /** 捕获警告 */
  captureWarning(message: string, source?: string): void {
    this.captureError(message, source);
  }

  /** 添加面包屑 */
  addBreadcrumb(message: string, category = 'navigation'): void {
    this.breadcrumbs.push({
      message,
      timestamp: Date.now(),
      category,
    });

    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs.shift();
    }
  }

  /** 获取面包屑 */
  getBreadcrumbs(): Array<{ message: string; timestamp: number; category: string }> {
    return [...this.breadcrumbs];
  }

  /** 清除面包屑 */
  clearBreadcrumbs(): void {
    this.breadcrumbs.length = 0;
  }

  /** 手动上报 */
  flush(): void {
    if (this.buffer.length === 0) return;

    const errors = [...this.buffer];
    this.buffer.length = 0;

    // 自定义处理器
    if (this.config.handler) {
      for (const error of errors) {
        this.config.handler(error);
      }
    }

    // 上报到服务器
    if (this.config.reportUrl) {
      this.reportToServer(errors);
    }

    // 小程序环境
    if (this.platform?.reportAnalytics) {
      for (const error of errors) {
        this.platform.reportAnalytics('error', {
          type: error.type,
          message: error.message,
          severity: error.severity,
          source: error.source,
        });
      }
    }
  }

  /** 获取缓冲区中的错误数量 */
  getBufferSize(): number {
    return this.buffer.length;
  }

  /** 清除缓冲区 */
  clearBuffer(): void {
    this.buffer.length = 0;
  }

  /** 获取会话 ID */
  getSessionId(): string {
    return this.sessionId;
  }

  /** 监听错误 */
  onError(callback: (error: ErrorInfo) => void): () => void {
    this.on('error:captured', callback as any);
    return () => this.off('error:captured', callback as any);
  }

  /** 监听严重错误 */
  onCriticalError(callback: (error: ErrorInfo) => void): () => void {
    this.on('error:critical', callback as any);
    return () => this.off('error:critical', callback as any);
  }

  /** 销毁 */
  destroy(): void {
    this.stop();
    this.buffer.length = 0;
    this.breadcrumbs.length = 0;
    this.emit('tracker:destroyed');
  }

  private installGlobalHandlers(): void {
    if (typeof window === 'undefined') return;

    // 保存原始处理器
    this.originalErrorHandler = window.onerror;

    // 全局错误处理器
    window.onerror = (message, source, lineno, colno, error) => {
      const errorInfo: ErrorInfo = {
        type: 'js_error',
        message: String(message),
        stack: error?.stack,
        source: source ?? undefined,
        line: lineno ?? undefined,
        column: colno ?? undefined,
        url: source ?? undefined,
        severity: 'high',
        device: this.getDeviceInfo(),
        user: {
          userId: this.userId ?? undefined,
          sessionId: this.sessionId,
        },
        timestamp: Date.now(),
      };

      this.handleError(errorInfo);

      // 调用原始处理器
      if (this.originalErrorHandler) {
        return this.originalErrorHandler.call(window, message, source, lineno, colno, error);
      }
      return false;
    };

    // 未处理的 Promise 拒绝
    if (this.config.capturePromiseRejections) {
      this.originalUnhandledRejection = (event: PromiseRejectionEvent) => {
        const errorInfo: ErrorInfo = {
          type: 'promise_rejection',
          message: event.reason?.message ?? String(event.reason),
          stack: event.reason?.stack,
          severity: 'high',
          device: this.getDeviceInfo(),
          user: {
            userId: this.userId ?? undefined,
            sessionId: this.sessionId,
          },
          timestamp: Date.now(),
        };

        this.handleError(errorInfo);
      };

      window.addEventListener('unhandledrejection', this.originalUnhandledRejection);
    }

    // 资源加载错误
    if (this.config.captureResourceErrors) {
      window.addEventListener('error', (event) => {
        const target = event.target as HTMLElement;
        if (target && (target.tagName === 'IMG' || target.tagName === 'SCRIPT' || target.tagName === 'LINK')) {
          const errorInfo: ErrorInfo = {
            type: 'resource_error',
            message: `资源加载失败: ${(target as any).src ?? target.getAttribute('href')}`,
            source: target.tagName,
            url: (target as any).src ?? target.getAttribute('href'),
            severity: 'medium',
            device: this.getDeviceInfo(),
            user: {
              userId: this.userId ?? undefined,
              sessionId: this.sessionId,
            },
            timestamp: Date.now(),
          };

          this.handleError(errorInfo);
        }
      }, true);
    }
  }

  private restoreGlobalHandlers(): void {
    if (typeof window === 'undefined') return;

    if (this.originalErrorHandler) {
      window.onerror = this.originalErrorHandler;
    }

    if (this.originalUnhandledRejection) {
      window.removeEventListener('unhandledrejection', this.originalUnhandledRejection);
    }
  }

  private handleError(errorInfo: ErrorInfo): void {
    // 应用过滤器
    if (this.config.filter && !this.config.filter(errorInfo)) {
      return;
    }

    // 发送事件
    this.emit('error:captured', errorInfo);

    // 严重错误单独发送
    if (errorInfo.severity === 'critical') {
      this.emit('error:critical', errorInfo);
    }

    // 添加到缓冲区
    this.buffer.push(errorInfo);

    // 限制缓冲区大小
    if (this.buffer.length > this.config.maxBufferSize) {
      this.buffer.shift();
    }

    // 立即上报严重错误
    if (errorInfo.severity === 'critical' && this.config.autoReport) {
      this.flush();
    }
  }

  private async reportToServer(errors: ErrorInfo[]): Promise<void> {
    if (!this.config.reportUrl) return;

    try {
      if (typeof fetch !== 'undefined') {
        await fetch(this.config.reportUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ errors }),
        });
      }
    } catch {
      // 上报失败，放回缓冲区
      this.buffer.unshift(...errors);
    }
  }

  private getDeviceInfo(): ErrorInfo['device'] {
    if (typeof navigator !== 'undefined') {
      return {
        platform: navigator.platform,
        system: navigator.userAgent,
        model: navigator.userAgent,
      };
    }
    if (this.platform?.getSystemInfoSync) {
      try {
        const info = this.platform.getSystemInfoSync();
        return {
          platform: info.platform,
          system: info.system,
          model: info.model,
        };
      } catch { /* ignore platform errors */ }
    }
    return undefined;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }
}

// ========== 便捷错误追踪 ==========

/** 创建错误追踪器（简化版） */
export function createErrorTracker(platform?: any): ErrorTracker {
  return new ErrorTracker(platform, {
    enabled: true,
    autoReport: false,
    maxBufferSize: 50,
  });
}

/** 创建完整错误追踪器（带上报） */
export function createFullErrorTracker(platform: any, reportUrl: string): ErrorTracker {
  return new ErrorTracker(platform, {
    enabled: true,
    reportUrl,
    autoReport: true,
    reportInterval: 30000,
    maxBufferSize: 200,
    captureResourceErrors: true,
    capturePromiseRejections: true,
  });
}
