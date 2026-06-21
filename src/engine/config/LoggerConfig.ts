import { LogLevel, type LoggerConfig } from '../utils/Logger';

// 默认日志配置：可在项目侧按需覆盖，并在运行时通过 Logger.configure 动态更新。
export const ENGINE_LOGGER_CONFIG: Partial<LoggerConfig> = {
  level: LogLevel.DEBUG,
  stackLevel: LogLevel.INFO,
  format: '[{timestamp}] [{level}] [{module}] {message}',
  console: {
    enabled: true,
  },
  file: {
    enabled: true,
    storageKey: 'engine.log',
    maxChars: 128 * 1024,
  },
  panel: {
    enabled: true,
    maxEntries: 48,
    width: 520,
    lineHeight: 16,
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    textColor: '#e8f1ff',
    borderColor: 'rgba(120, 200, 255, 0.45)',
  }
};
