// 平台统计SDK适配：统一的数据上报接口，支持微信、抖音、H5平台。
import { Logger } from '../utils/Logger';

export interface AnalyticsEvent {
  name: string;
  params?: Record<string, unknown>;
  timestamp?: number;
}

export interface UserProperties {
  [key: string]: string | number | boolean;
}

export abstract class AnalyticsAdapter {
  abstract trackEvent(event: AnalyticsEvent): void;
  abstract setUserProperties(properties: UserProperties): void;
  abstract setUserId(userId: string): void;
  abstract startSession(): void;
  abstract endSession(): void;
}

const analyticsLogger = Logger.forModule('Analytics');

/** 微信统计适配器 */
export class WxAnalyticsAdapter extends AnalyticsAdapter {
  trackEvent(event: AnalyticsEvent): void {
    if (typeof wx === 'undefined') return;
    
    // 微信小游戏数据上报
    wx.reportAnalytics(event.name, event.params || {});
  }

  setUserProperties(properties: UserProperties): void {
    if (typeof wx === 'undefined') return;
    
    // 微信用户属性上报
    Object.keys(properties).forEach(key => {
      wx.reportAnalytics('user_property', {
        property_name: key,
        property_value: String(properties[key])
      });
    });
  }

  setUserId(userId: string): void {
    if (typeof wx === 'undefined') return;
    
    wx.reportAnalytics('user_login', { user_id: userId });
  }

  startSession(): void {
    if (typeof wx === 'undefined') return;
    
    wx.reportAnalytics('session_start', { timestamp: Date.now() });
  }

  endSession(): void {
    if (typeof wx === 'undefined') return;
    
    wx.reportAnalytics('session_end', { timestamp: Date.now() });
  }
}

/** 抖音统计适配器 */
export class TtAnalyticsAdapter extends AnalyticsAdapter {
  trackEvent(event: AnalyticsEvent): void {
    if (typeof tt === 'undefined') return;
    
    tt.reportAnalytics(event.name, event.params || {});
  }

  setUserProperties(properties: UserProperties): void {
    if (typeof tt === 'undefined') return;
    
    Object.keys(properties).forEach(key => {
      tt.reportAnalytics('user_property', {
        property_name: key,
        property_value: String(properties[key])
      });
    });
  }

  setUserId(userId: string): void {
    if (typeof tt === 'undefined') return;
    
    tt.reportAnalytics('user_login', { user_id: userId });
  }

  startSession(): void {
    if (typeof tt === 'undefined') return;
    
    tt.reportAnalytics('session_start', { timestamp: Date.now() });
  }

  endSession(): void {
    if (typeof tt === 'undefined') return;
    
    tt.reportAnalytics('session_end', { timestamp: Date.now() });
  }
}

/** H5统计适配器（支持自定义上报） */
export class H5AnalyticsAdapter extends AnalyticsAdapter {
  private apiEndpoint: string;
  private buffer: AnalyticsEvent[] = [];
  private flushInterval: number;
  private timer: ReturnType<typeof setInterval> | null = null;
  private maxBufferSize = 100;

  constructor(apiEndpoint: string, flushInterval = 5000) {
    super();
    this.apiEndpoint = apiEndpoint;
    this.flushInterval = flushInterval;
  }

  trackEvent(event: AnalyticsEvent): void {
    this.buffer.push({
      ...event,
      timestamp: event.timestamp || Date.now()
    });

    // 缓冲满时立即上报
    if (this.buffer.length >= 20) {
      this.flush();
    }
  }

  setUserProperties(properties: UserProperties): void {
    this.trackEvent({
      name: 'user_properties',
      params: properties
    });
  }

  setUserId(userId: string): void {
    this.trackEvent({
      name: 'user_login',
      params: { user_id: userId }
    });
  }

  startSession(): void {
    this.trackEvent({
      name: 'session_start',
      params: { timestamp: Date.now() }
    });

    // 启动定时上报
    this.timer = setInterval(() => this.flush(), this.flushInterval);
  }

  endSession(): void {
    this.trackEvent({
      name: 'session_end',
      params: { timestamp: Date.now() }
    });

    this.flush();

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
        body: JSON.stringify({ events })
      });
    } catch (err) {
      analyticsLogger.error('H5AnalyticsAdapter: flush failed error=%o', err);
      // 失败时重新加入缓冲（限制最大缓冲区大小）
      this.buffer.unshift(...events);
      if (this.buffer.length > this.maxBufferSize) {
        this.buffer = this.buffer.slice(0, this.maxBufferSize);
      }
    }
  }
}

/** 统计管理器 */
export class AnalyticsManager {
  private adapter: AnalyticsAdapter;
  private sessionStartTime = 0;

  constructor(adapter: AnalyticsAdapter) {
    this.adapter = adapter;
  }

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
      duration
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
