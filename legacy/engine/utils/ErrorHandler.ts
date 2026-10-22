// 全局错误捕获：防止未处理异常导致白屏，提供错误上报能力。
import { Logger } from './Logger';

export type ErrorHandler = (error: ErrorInfo) => void;

const errorLogger = Logger.forModule('ErrorHandler');

export interface ErrorInfo {
  type: 'js_error' | 'promise_error' | 'resource_error' | 'render_error';
  message: string;
  source?: string;
  lineno?: number;
  colno?: number;
  stack?: string;
  timestamp: number;
  extra?: Record<string, unknown>;
}

type ErrorLike = {
  message?: string;
  stack?: string;
};

export class ErrorHandlerManager {
  private static handlers: ErrorHandler[] = [];
  private static initialized = false;
  private static errorBuffer: ErrorInfo[] = [];
  private static maxBufferSize = 50;

  /** 初始化全局错误捕获 */
  static init(): void {
    if (ErrorHandlerManager.initialized) return;
    ErrorHandlerManager.initialized = true;

    // 捕获JS运行时错误
    if (typeof window !== 'undefined') {
      window.onerror = (message, source, lineno, colno, error) => {
        ErrorHandlerManager.reportError({
          type: 'js_error',
          message: String(message),
          source,
          lineno,
          colno,
          stack: error?.stack,
          timestamp: Date.now()
        });
        return false; // 不阻止默认行为
      };

      // 捕获未处理的Promise rejection
      window.addEventListener('unhandledrejection', (event) => {
        ErrorHandlerManager.reportError({
          type: 'promise_error',
          message: event.reason?.message || 'Unhandled Promise Rejection',
          stack: event.reason?.stack,
          timestamp: Date.now()
        });
      });
    }

    // 微信小游戏环境
    if (typeof wx !== 'undefined') {
      const wxApi = wx as { onError?: (cb: (message: string) => void) => void };
      if (wxApi.onError) {
        wxApi.onError((message: string) => {
          ErrorHandlerManager.reportError({
            type: 'js_error',
            message,
            timestamp: Date.now()
          });
        });
      }
    }

    // 抖音小游戏环境
    if (typeof tt !== 'undefined') {
      const ttApi = tt as { onError?: (cb: (message: string) => void) => void };
      if (ttApi.onError) {
        ttApi.onError((message: string) => {
          ErrorHandlerManager.reportError({
            type: 'js_error',
            message,
            timestamp: Date.now()
          });
        });
      }
    }
  }

  /** 注册错误处理回调 */
  static on(handler: ErrorHandler): () => void {
    ErrorHandlerManager.handlers.push(handler);
    return () => {
      const index = ErrorHandlerManager.handlers.indexOf(handler);
      if (index >= 0) ErrorHandlerManager.handlers.splice(index, 1);
    };
  }

  /** 上报错误 */
  static reportError(error: ErrorInfo): void {
    // 添加到缓冲区
    ErrorHandlerManager.errorBuffer.push(error);
    if (ErrorHandlerManager.errorBuffer.length > ErrorHandlerManager.maxBufferSize) {
      ErrorHandlerManager.errorBuffer.shift();
    }

    // 通知所有处理器
    for (const handler of ErrorHandlerManager.handlers) {
      try {
        handler(error);
      } catch (e) {
        errorLogger.error('handler threw exception error=%o', e);
      }
    }

    // 控制台输出
    errorLogger.error('[%s] %s %o', error.type, error.message, error);
  }

  /** 获取错误缓冲区 */
  static getErrorBuffer(): ErrorInfo[] {
    return [...ErrorHandlerManager.errorBuffer];
  }

  /** 清空错误缓冲区 */
  static clearBuffer(): void {
    ErrorHandlerManager.errorBuffer.length = 0;
  }

  /** 包装函数，捕获同步和异步错误 */
  static wrap<TArgs extends unknown[], TResult>(
    fn: (...args: TArgs) => TResult,
    context?: string
  ): (...args: TArgs) => TResult {
    return ((...args: TArgs) => {
      try {
        const result = fn(...args);
        // 处理异步函数
        if (result instanceof Promise) {
          return result.catch((error: Error) => {
            ErrorHandlerManager.reportError({
              type: 'js_error',
              message: error.message,
              stack: error.stack,
              timestamp: Date.now(),
              extra: { context }
            });
            throw error;
          }) as TResult;
        }
        return result;
      } catch (error) {
        const err = error as ErrorLike;
        ErrorHandlerManager.reportError({
          type: 'js_error',
          message: err.message ?? 'Unknown error',
          stack: err.stack,
          timestamp: Date.now(),
          extra: { context }
        });
        throw error;
      }
    }) as (...args: TArgs) => TResult;
  }

  /** 安全执行函数，捕获错误但不抛出 */
  static safe<TArgs extends unknown[], TResult>(
    fn: (...args: TArgs) => TResult,
    fallback?: TResult,
    context?: string
  ): (...args: TArgs) => TResult {
    return ((...args: TArgs) => {
      try {
        const result = fn(...args);
        if (result instanceof Promise) {
          return result.catch((error: Error) => {
            ErrorHandlerManager.reportError({
              type: 'js_error',
              message: error.message,
              stack: error.stack,
              timestamp: Date.now(),
              extra: { context }
            });
            return fallback as TResult;
          }) as TResult;
        }
        return result;
      } catch (error) {
        const err = error as ErrorLike;
        ErrorHandlerManager.reportError({
          type: 'js_error',
          message: err.message ?? 'Unknown error',
          stack: err.stack,
          timestamp: Date.now(),
          extra: { context }
        });
        return fallback as TResult;
      }
    }) as (...args: TArgs) => TResult;
  }
}
