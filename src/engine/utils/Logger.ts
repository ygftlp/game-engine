// 日志工具：支持分级过滤、异步多端输出与调试面板。
import type { IPlatform } from '../platform/Platform';

type LoggerPlatform = Pick<IPlatform, 'setStorage' | 'getStorage'>;
type ConsoleMethod = 'debug' | 'info' | 'warn' | 'error';
type RenderTarget = {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
};

const COMPILE_TIME_DEV = __DEV__;

export enum LogLevel {
  DEBUG = 10,
  INFO = 20,
  WARNING = 30,
  ERROR = 40,
  FATAL = 50,
  SILENT = 99,
}

export interface LogEntry {
  timestamp: number;
  isoTime: string;
  level: LogLevel;
  levelName: string;
  module: string;
  message: string;
  stack: string;
  formatted: string;
}

export interface LoggerConfig {
  development: boolean;
  level: LogLevel;
  stackLevel: LogLevel;
  format: string;
  maxQueueSize: number;
  serializerDepth: number;
  console: {
    enabled: boolean;
  };
  file: {
    enabled: boolean;
    storageKey: string;
    maxChars: number;
  };
  panel: {
    enabled: boolean;
    maxEntries: number;
    width: number;
    lineHeight: number;
    padding: number;
    backgroundColor: string;
    textColor: string;
    borderColor: string;
  };
}

type LoggerConfigInput = Omit<Partial<LoggerConfig>, 'console' | 'file' | 'panel'> & {
  console?: Partial<LoggerConfig['console']>;
  file?: Partial<LoggerConfig['file']>;
  panel?: Partial<LoggerConfig['panel']>;
};

type LogMessageFactory = () => unknown;

interface LogSink {
  write(entries: LogEntry[]): Promise<void> | void;
  dispose?(): void;
}

const DEFAULT_LOGGER_CONFIG: LoggerConfig = {
  development: COMPILE_TIME_DEV,
  level: COMPILE_TIME_DEV ? LogLevel.DEBUG : LogLevel.INFO,
  stackLevel: COMPILE_TIME_DEV ? LogLevel.DEBUG : LogLevel.ERROR,
  format: '[{timestamp}] [{level}] [{module}] {message}',
  maxQueueSize: 512,
  serializerDepth: 4,
  console: {
    enabled: true,
  },
  file: {
    enabled: true,
    storageKey: 'engine.log',
    maxChars: 128 * 1024,
  },
  panel: {
    enabled: COMPILE_TIME_DEV,
    maxEntries: 48,
    width: 520,
    lineHeight: 16,
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    textColor: '#e8f1ff',
    borderColor: 'rgba(120, 200, 255, 0.45)',
  }
};

function levelName(level: LogLevel): string {
  switch (level) {
    case LogLevel.DEBUG:
      return 'DEBUG';
    case LogLevel.INFO:
      return 'INFO';
    case LogLevel.WARNING:
      return 'WARNING';
    case LogLevel.ERROR:
      return 'ERROR';
    case LogLevel.FATAL:
      return 'FATAL';
    default:
      return 'SILENT';
  }
}

class ConsoleLogSink implements LogSink {
  write(entries: LogEntry[]): void {
    for (const entry of entries) {
      const method = this.methodFor(entry.level);
      const output = entry.stack ? `${entry.formatted}\n${entry.stack}` : entry.formatted;
      // eslint-disable-next-line no-console
      console[method](output);
    }
  }

  private methodFor(level: LogLevel): ConsoleMethod {
    if (level >= LogLevel.ERROR) return 'error';
    if (level === LogLevel.WARNING) return 'warn';
    if (level === LogLevel.INFO) return 'info';
    return 'debug';
  }
}

class StorageLogFileSink implements LogSink {
  private cache: string;

  constructor(
    private readonly platform: LoggerPlatform,
    private readonly storageKey: string,
    private readonly maxChars: number
  ) {
    this.cache = platform.getStorage(storageKey) ?? '';
  }

  write(entries: LogEntry[]): void {
    const lines = entries.map((entry) => entry.stack ? `${entry.formatted}\n${entry.stack}` : entry.formatted);
    const chunk = lines.join('\n');
    this.cache = this.cache ? `${this.cache}\n${chunk}` : chunk;
    if (this.cache.length > this.maxChars) {
      this.cache = this.cache.slice(this.cache.length - this.maxChars);
    }
    this.platform.setStorage(this.storageKey, this.cache);
  }

  dispose(): void {
    this.platform.setStorage(this.storageKey, this.cache);
  }
}

class DebugPanelSink implements LogSink {
  private readonly lines: string[] = [];

  constructor(private readonly config: LoggerConfig['panel']) {}

  write(entries: LogEntry[]): void {
    for (const entry of entries) {
      this.lines.push(entry.formatted);
    }
    if (this.lines.length > this.config.maxEntries) {
      this.lines.splice(0, this.lines.length - this.config.maxEntries);
    }
  }

  render(target: RenderTarget): void {
    if (this.lines.length === 0) return;

    const width = Math.min(this.config.width, target.width - this.config.padding * 2);
    const panelHeight = this.lines.length * this.config.lineHeight + this.config.padding * 2;
    const ctx = target.ctx;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = this.config.backgroundColor;
    ctx.strokeStyle = this.config.borderColor;
    ctx.lineWidth = 1;
    ctx.fillRect(this.config.padding, this.config.padding, width, panelHeight);
    ctx.strokeRect(this.config.padding, this.config.padding, width, panelHeight);
    ctx.fillStyle = this.config.textColor;
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    for (let i = 0; i < this.lines.length; i++) {
      ctx.fillText(
        this.lines[i],
        this.config.padding * 2,
        this.config.padding * 2 + i * this.config.lineHeight
      );
    }
    ctx.restore();
  }

  clear(): void {
    this.lines.length = 0;
  }

  snapshot(): string[] {
    return [...this.lines];
  }
}

export class ModuleLogger {
  constructor(private readonly moduleName: string) {}

  debug(message: string | LogMessageFactory, ...args: unknown[]): void {
    Logger.log(LogLevel.DEBUG, this.moduleName, message, ...args);
  }

  info(message: string | LogMessageFactory, ...args: unknown[]): void {
    Logger.log(LogLevel.INFO, this.moduleName, message, ...args);
  }

  warning(message: string | LogMessageFactory, ...args: unknown[]): void {
    Logger.log(LogLevel.WARNING, this.moduleName, message, ...args);
  }

  warn(message: string | LogMessageFactory, ...args: unknown[]): void {
    this.warning(message, ...args);
  }

  error(message: string | LogMessageFactory, ...args: unknown[]): void {
    Logger.log(LogLevel.ERROR, this.moduleName, message, ...args);
  }

  fatal(message: string | LogMessageFactory, ...args: unknown[]): void {
    Logger.log(LogLevel.FATAL, this.moduleName, message, ...args);
  }
}

export class Logger {
  private static config: LoggerConfig = { ...DEFAULT_LOGGER_CONFIG };
  private static platform: LoggerPlatform | null = null;
  private static sinks: LogSink[] = [new ConsoleLogSink()];
  private static debugPanelSink: DebugPanelSink | null = null;
  private static queue: LogEntry[] = [];
  private static flushTimer: ReturnType<typeof setTimeout> | null = null;
  private static flushPromise: Promise<void> = Promise.resolve();

  static configure(config: LoggerConfigInput): void {
    Logger.config = Logger.mergeConfig(Logger.config, config);
    Logger.rebuildSinks();
  }

  static attachPlatform(platform: LoggerPlatform): void {
    Logger.platform = platform;
    Logger.rebuildSinks();
  }

  static setDevelopmentMode(development: boolean): void {
    Logger.config = { ...Logger.config, development };
  }

  static setLevel(level: LogLevel): void {
    Logger.config = { ...Logger.config, level };
  }

  static forModule(moduleName: string): ModuleLogger {
    return new ModuleLogger(moduleName);
  }

  static debug(message: string | LogMessageFactory, ...args: unknown[]): void {
    Logger.log(LogLevel.DEBUG, 'Engine', message, ...args);
  }

  static info(message: string | LogMessageFactory, ...args: unknown[]): void {
    Logger.log(LogLevel.INFO, 'Engine', message, ...args);
  }

  static warning(message: string | LogMessageFactory, ...args: unknown[]): void {
    Logger.log(LogLevel.WARNING, 'Engine', message, ...args);
  }

  static warn(message: string | LogMessageFactory, ...args: unknown[]): void {
    Logger.warning(message, ...args);
  }

  static error(message: string | LogMessageFactory, ...args: unknown[]): void {
    Logger.log(LogLevel.ERROR, 'Engine', message, ...args);
  }

  static fatal(message: string | LogMessageFactory, ...args: unknown[]): void {
    Logger.log(LogLevel.FATAL, 'Engine', message, ...args);
  }

  static renderPanel(target: RenderTarget): void {
    Logger.debugPanelSink?.render(target);
  }

  static getPanelLines(): string[] {
    return Logger.debugPanelSink?.snapshot() ?? [];
  }

  static async flush(): Promise<void> {
    if (Logger.flushTimer) {
      clearTimeout(Logger.flushTimer);
      Logger.flushTimer = null;
    }
    if (Logger.queue.length === 0) return Logger.flushPromise;

    const batch = Logger.queue.splice(0, Logger.queue.length);
    Logger.flushPromise = Logger.flushPromise.then(async () => {
      for (const sink of Logger.sinks) {
        await sink.write(batch);
      }
    });
    return Logger.flushPromise;
  }

  static dispose(): void {
    if (Logger.flushTimer) {
      clearTimeout(Logger.flushTimer);
      Logger.flushTimer = null;
    }
    for (const sink of Logger.sinks) {
      sink.dispose?.();
    }
    Logger.queue.length = 0;
    Logger.debugPanelSink?.clear();
  }

  static resetForTests(): void {
    Logger.dispose();
    Logger.platform = null;
    Logger.config = { ...DEFAULT_LOGGER_CONFIG };
    Logger.sinks = [new ConsoleLogSink()];
    Logger.debugPanelSink = null;
    Logger.flushPromise = Promise.resolve();
    Logger.rebuildSinks();
  }

  static log(level: LogLevel, moduleName: string, message: string | LogMessageFactory, ...args: unknown[]): void {
    if (!Logger.shouldLog(level)) return;

    const isoTime = new Date().toISOString();
    const entryMessage = Logger.formatMessage(message, args);
    const stack = level >= Logger.config.stackLevel ? Logger.captureStack() : '';
    const entry: LogEntry = {
      timestamp: Date.now(),
      isoTime,
      level,
      levelName: levelName(level),
      module: moduleName,
      message: entryMessage,
      stack,
      formatted: Logger.applyFormat(Logger.config.format, {
        timestamp: isoTime,
        level: levelName(level),
        module: moduleName,
        message: entryMessage,
        stack
      })
    };

    Logger.queue.push(entry);
    if (Logger.queue.length > Logger.config.maxQueueSize) {
      Logger.queue.splice(0, Logger.queue.length - Logger.config.maxQueueSize);
    }
    Logger.scheduleFlush();

    if (level === LogLevel.FATAL) {
      void Logger.flush();
    }
  }

  private static shouldLog(level: LogLevel): boolean {
    if (level === LogLevel.DEBUG && !Logger.config.development) {
      return false;
    }
    return level >= Logger.config.level && level < LogLevel.SILENT;
  }

  private static scheduleFlush(): void {
    if (Logger.flushTimer) return;
    Logger.flushTimer = setTimeout(() => {
      Logger.flushTimer = null;
      void Logger.flush();
    }, 0);
  }

  private static rebuildSinks(): void {
    Logger.debugPanelSink = null;
    Logger.sinks = [];

    if (Logger.config.console.enabled) {
      Logger.sinks.push(new ConsoleLogSink());
    }
    if (Logger.config.file.enabled && Logger.platform) {
      Logger.sinks.push(
        new StorageLogFileSink(
          Logger.platform,
          Logger.config.file.storageKey,
          Logger.config.file.maxChars
        )
      );
    }
    if (Logger.config.panel.enabled) {
      Logger.debugPanelSink = new DebugPanelSink(Logger.config.panel);
      Logger.sinks.push(Logger.debugPanelSink);
    }
  }

  private static mergeConfig(base: LoggerConfig, next: LoggerConfigInput): LoggerConfig {
    return {
      ...base,
      ...next,
      console: {
        ...base.console,
        ...next.console,
      },
      file: {
        ...base.file,
        ...next.file,
      },
      panel: {
        ...base.panel,
        ...next.panel,
      }
    };
  }

  private static formatMessage(message: string | LogMessageFactory, args: unknown[]): string {
    const source = typeof message === 'function' ? message() : message;
    if (typeof source === 'string') {
      return Logger.formatTemplate(source, args);
    }
    return [source, ...args]
      .map((item) => Logger.serialize(item, Logger.config.serializerDepth, new Set<unknown>()))
      .join(' ');
  }

  private static formatTemplate(template: string, args: unknown[]): string {
    let argIndex = 0;
    const rendered = template.replace(/%[sdjo]/g, (token) => {
      const value = args[argIndex++];
      switch (token) {
        case '%d':
          return String(typeof value === 'number' ? value : Number(value));
        case '%j':
        case '%o':
          return Logger.serialize(value, Logger.config.serializerDepth, new Set<unknown>());
        case '%s':
        default:
          return String(value);
      }
    });
    if (argIndex >= args.length) return rendered;
    const remain = args
      .slice(argIndex)
      .map((item) => Logger.serialize(item, Logger.config.serializerDepth, new Set<unknown>()))
      .join(' ');
    return remain ? `${rendered} ${remain}` : rendered;
  }

  private static serialize(value: unknown, depth: number, seen: Set<unknown>): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
      return String(value);
    }
    if (typeof value === 'function') {
      const fn = value as { name?: string };
      return `[Function ${fn.name || 'anonymous'}]`;
    }
    if (value instanceof Error) {
      return value.stack || value.message;
    }
    if (depth <= 0) {
      return Array.isArray(value) ? '[Array]' : '[Object]';
    }
    if (seen.has(value)) return '[Circular]';
    seen.add(value);

    if (Array.isArray(value)) {
      return `[${value.map((item) => Logger.serialize(item, depth - 1, seen)).join(', ')}]`;
    }

    if (typeof value === 'object') {
      const entries = Object.entries(value as Record<string, unknown>).map(
        ([key, item]) => `${key}: ${Logger.serialize(item, depth - 1, seen)}`
      );
      return `{ ${entries.join(', ')} }`;
    }
    return String(value);
  }

  private static applyFormat(format: string, values: Record<string, string>): string {
    return format.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? '');
  }

  private static captureStack(): string {
    const stack = new Error().stack;
    if (!stack) return '';
    return stack
      .split('\n')
      .slice(4, 8)
      .map((line) => line.trim())
      .join('\n');
  }
}
