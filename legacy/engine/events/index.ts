// 移动端事件系统统一导出

// 增强事件系统
export { EventEmitter } from '../core/EventEmitter';
export type { EventListener } from '../core/EventEmitter';
export { EnhancedEventEmitter, TypedEventEmitter } from '../core/EnhancedEventEmitter';
export type { EventListenerOptions, EnhancedEventListener, EventInterceptor } from '../core/EnhancedEventEmitter';

// 移动端通用事件
export { MobileEventManager, GAME_EVENTS } from '../platform/MobileEvents';
export type {
  AppLifecycleState, ScreenOrientation, NetworkType, NetworkStatus,
  BatteryStatus, DeviceInfo, GestureType, GestureEvent,
  ShakeEvent, ClipboardEvent, KeyboardEvent,
} from '../platform/MobileEvents';

// 广告系统
export { AdManager, createRewardedAdConfig, createInterstitialAdConfig, createBannerAdConfig } from '../platform/AdSystem';
export type { AdType, AdStatus, AdEvent, AdConfig, AdInstance } from '../platform/AdSystem';

// 支付系统
export { PaymentManager, createCoinProduct, createMonthCardProduct } from '../platform/PaymentSystem';
export type { PaymentStatus, PaymentEvent, PaymentProduct, PaymentOrder, PaymentConfig } from '../platform/PaymentSystem';

// 性能监控
export { PerformanceMonitor, Profiler, createFpsMonitor, createMemoryMonitor } from '../utils/PerformanceMonitor';
export type { PerformanceMetrics, PerformanceWarning, PerformanceWarningLevel, PerformanceConfig } from '../utils/PerformanceMonitor';

// 错误追踪
export { ErrorTracker, createErrorTracker, createFullErrorTracker } from '../utils/ErrorTracker';
export type { ErrorType, ErrorSeverity, ErrorInfo, ErrorTrackerConfig } from '../utils/ErrorTracker';
