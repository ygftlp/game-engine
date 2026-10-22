// 统计抽象：引擎只提供统一事件模型和管理器，不直接依赖 wx / tt 等平台全局对象。
// 具体平台的数据上报函数由业务项目或平台插件注入。
import { Logger } from '../utils/Logger';

export interface AnalyticsEvent {
  name: string;
  params?: Record<string, unknown>;
  timestamp?: number;
}

export interface UserProperties {
  [key: string]: string | number | boolean;
}

export type AnalyticsReporter = (eventName: string, data?: Record<string, unknown>) => void;

export interface AnalyticsReporterConfig {
  userPropertyEventName?: string;
  userLoginEventName?: string;
  sessionStartEventName?: string;
  sessionEndEventName?: string;
}

export abstract class AnalyticsAdapter {
  abstract trackEvent(event: AnalyticsEvent): void;
  abstract setUserProperties(properties: UserProperties): void;
  abstract setUserId(userId: string): void;
  abstract startSession(): void;
  abstract endSession(): void;
}

const analyticsLogger = Logger.forModule('Analytics');
const DEFAULT_REPORTER_CONFIG: Required<AnalyticsReporterConfig> = {
  userPropertyEventName: 'user_property',
  userLoginEventName: 'user_login',
  sessionStartEventName: 'session_start',
  sessionEndEventName: 'session_end',
};

/** 空统计适配器：用于开发、测试或未接入统计 SDK 的场景。 */
export class NoopAnalyticsAdapter extends AnalyticsAdapter {
  trackEvent(_event: AnalyticsEvent): void {
    return;
  }

  setUserProperties(_properties: UserProperties): void {
    return;
  }

  setUserId(_userId: string): void {
    return;
  }

  startSession(): void {
    return;
  }

  endSession(): void {
    return;
  }
}

/**
 * 注入式统计适配器。
 *
 * 微信小游戏业务层示例：
 * ```ts
 * new ReportAnalyticsAdapter((name, data) => wx.reportAnalytics(name, data ?? {}));
 * ```
 *
 * 抖音小游戏业务层示例：
 * ```ts
 * new ReportAnalyticsAdapter((name, data) => tt.reportAnalytics(name, data ?? {}));
 * ```
 */
export class ReportAnalyticsAdapter extends AnalyticsAdapter {
  private readonly config: Required<AnalyticsReporterConfig>;

  constructor(private readonly reporter: AnalyticsReporter, config: AnalyticsReporterConfig = {}) {
    super();
    this.config = { ...DEFAULT_REPORTER_CONFIG, ...config };
  }

  trackEvent(event: AnalyticsEvent): void {
    this.reporter(event.name, event.params ?? {});
  }

  setUserProperties(properties: UserProperties): void {
    Object.keys(properties).forEach((key) => {
      this.reporter(this.config.userPropertyEventName, {
        property_name: key,
        property_value: String(properties[key]),
      });
    });
  }

  setUserId(userId: string): void {
    this.reporter(this.config.userLoginEventName, { user_id: userId });
  }

  startSession(): void {
    this.reporter(this.config.sessionStartEventName, { timestamp: Date.now() });
  }

  endSession(): void {
    this.reporter(this.config.sessionEndEventName, { timestamp: Date.now() });
  }
}

/**
 * 微信统计适配器外壳。
 *
 * 注意：引擎不直接调用 `wx.reportAnalytics`。业务项目需要显式注入平台实现：
 * ```ts
 * new WxAnalyticsAdapter((name, data) => wx.reportAnalytics(name, data ?? {}));
 * ```
 */
export class WxAnalyticsAdapter extends ReportAnalyticsAdapter {}

/**
 * 抖音统计适配器外壳。
 *
 * 注意：引擎不直接调用 `tt.reportAnalytics`。业务项目需要显式注入平台实现：
 * ```ts
 * new TtAnalyticsAdapter((name, data) => tt.reportAnalytics(name, data ?? {}));
 * ```
 */
export class TtAnalyticsAdapter extends ReportAnalyticsAdapter {}

/** HTTP 统计适配器：适合 H5 或自建服务端上报。 */
export class HttpAnalyticsAdapter extends AnalyticsAdapter {
  private buffer: AnalyticsEvent[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  private maxBufferSize = 100;

  constructor(private readonly apiEndpoint: string, private readonly flushInterval = 5000) {
    super();
  }

  trackEvent(event: AnalyticsEvent): void {
    this.buffer.push({
      ...event,
      timestamp: event.timestamp ?? Date.now(),
    });

    if (this.buffer.length >= 20) {
      void this.flush();
    }
  }

  setUserProperties(properties: UserProperties): void {
    this.trackEvent({
      name: 'user_properties',
      params: properties,
    });
  }

  setUserId(userId: string): void {
    this.trackEvent({
      name: 'user_login',
      params: { user_id: userId },
    });
  }

  startSession(): void {
    this.trackEvent({
      name: 'session_start',
      params: { timestamp: Date.now() },
    });

    this.timer = setInterval(() => void this.flush(), this.flushInterval);
  }

  endSession(): void {
    this.trackEvent({
      name: 'session_end',
      params: { timestamp: Date.now() },
    });

    void this.flush();

    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /** 上报缓冲数据 */
  private async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const events = [...this.buffer];
    this.buffer = [];

    try {
      await fetch(`${this.apiEndpoint}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events }),
      });
    } catch (err) {
      analyticsLogger.error('HttpAnalyticsAdapter: flush failed error=%o', err);
      this.buffer.unshift(...events);
      if (this.buffer.length > this.maxBufferSize) {
        this.buffer = this.buffer.slice(0, this.maxBufferSize);
      }
    }
  }
}

/** 兼容旧命名：H5 场景可继续使用 H5AnalyticsAdapter。 */
export class H5AnalyticsAdapter extends HttpAnalyticsAdapter {}

/** 统计管理器 */
export class AnalyticsManager {
  private sessionStartTime = 0;

  constructor(private readonly adapter: AnalyticsAdapter) {}

  /** 开始会话 */
  startSession(): void {
    this.sessionStartTime = Date.now();
    this.adapter.startSession();
  }

  /** 结束会话 */
  endSession(): void {
    const duration = Date.now() - this.sessionStartTime;
    this.trackEvent('session_duration', { duration });
    this.adapter.endSession();
  }

  /** 追踪事件 */
  trackEvent(name: string, params?: Record<string, unknown>): void {
    this.adapter.trackEvent({ name, params });
  }

  /** 追踪页面访问 */
  trackPageView(pageName: string): void {
    this.trackEvent('page_view', { page_name: pageName });
  }

  /** 追踪游戏开始 */
  trackGameStart(gameMode?: string): void {
    this.trackEvent('game_start', { game_mode: gameMode });
  }

  /** 追踪游戏结束 */
  trackGameEnd(score: number, duration: number, gameMode?: string): void {
    this.trackEvent('game_end', {
      game_mode: gameMode,
      score,
      duration,
    });
  }

  /** 追踪关卡完成 */
  trackLevelComplete(level: number, score: number, duration: number): void {
    this.trackEvent('level_complete', { level, score, duration });
  }

  /** 追踪购买 */
  trackPurchase(productId: string, amount: number, currency: string): void {
    this.trackEvent('purchase', { product_id: productId, amount, currency });
  }

  /** 追踪分享 */
  trackShare(platform: string, contentType: string): void {
    this.trackEvent('share', { platform, content_type: contentType });
  }

  /** 追踪广告展示 */
  trackAdShow(adType: string, adId: string): void {
    this.trackEvent('ad_show', { ad_type: adType, ad_id: adId });
  }

  /** 追踪广告点击 */
  trackAdClick(adType: string, adId: string): void {
    this.trackEvent('ad_click', { ad_type: adType, ad_id: adId });
  }

  /** 设置用户属性 */
  setUserProperties(properties: UserProperties): void {
    this.adapter.setUserProperties(properties);
  }

  /** 设置用户ID */
  setUserId(userId: string): void {
    this.adapter.setUserId(userId);
  }
}
