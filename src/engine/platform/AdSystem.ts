// 广告系统：支持横幅、插屏、激励视频、原生广告，跨平台适配。

import { EventEmitter } from '../core/EventEmitter';

/** 广告类型 */
export type AdType = 'banner' | 'interstitial' | 'rewarded' | 'native';

/** 广告状态 */
export type AdStatus = 'loading' | 'loaded' | 'showing' | 'hidden' | 'error' | 'closed';

/** 广告事件 */
export interface AdEvent {
  /** 广告类型 */
  type: AdType;
  /** 广告单元 ID */
  adUnitId: string;
  /** 事件类型 */
  event: 'loaded' | 'shown' | 'clicked' | 'closed' | 'rewarded' | 'error' | 'skip';
  /** 错误信息 */
  error?: string;
  /** 激励奖励类型 */
  rewardType?: string;
  /** 激励奖励数量 */
  rewardAmount?: number;
  /** 时间戳 */
  timestamp: number;
}

/** 广告配置 */
export interface AdConfig {
  /** 广告单元 ID */
  adUnitId: string;
  /** 广告类型 */
  type: AdType;
  /** 是否自动加载 */
  autoLoad?: boolean;
  /** 加载超时（毫秒） */
  loadTimeout?: number;
  /** 展示间隔（秒，防止频繁展示） */
  showInterval?: number;
  /** 最大展示次数 */
  maxShowCount?: number;
  /** 展示位置（banner 用） */
  position?: 'top' | 'bottom';
  /** 展示宽度（banner 用） */
  width?: number;
  /** 展示高度（banner 用） */
  height?: number;
}

/** 广告实例 */
export interface AdInstance {
  /** 广告配置 */
  config: AdConfig;
  /** 当前状态 */
  status: AdStatus;
  /** 加载时间 */
  loadedAt: number;
  /** 展示次数 */
  showCount: number;
  /** 上次展示时间 */
  lastShowTime: number;
}

/**
 * 广告管理器
 * 
 * 使用示例：
 *   const adMgr = new AdManager(platform);
 *   
 *   // 预加载激励视频
 *   adMgr.load({ adUnitId: 'reward_001', type: 'rewarded' });
 *   
 *   // 监听广告事件
 *   adMgr.onAdEvent((event) => {
 *     if (event.event === 'rewarded') {
 *       // 发放奖励
 *       addCoins(event.rewardAmount ?? 0);
 *     }
 *   });
 *   
 *   // 展示激励视频
 *   adMgr.showRewarded('reward_001');
 */
export class AdManager extends EventEmitter {
  private platform: any;
  private instances = new Map<string, AdInstance>();
  private adConfigs = new Map<string, AdConfig>();

  constructor(platform?: any) {
    super();
    this.platform = platform;
  }

  /** 注册广告配置 */
  register(config: AdConfig): void {
    this.adConfigs.set(config.adUnitId, config);
    this.instances.set(config.adUnitId, {
      config,
      status: 'loading',
      loadedAt: 0,
      showCount: 0,
      lastShowTime: 0,
    });

    if (config.autoLoad) {
      this.load(config.adUnitId);
    }
  }

  /** 批量注册广告 */
  registerAll(configs: AdConfig[]): void {
    configs.forEach(c => this.register(c));
  }

  /** 加载广告 */
  load(adUnitId: string): Promise<boolean> {
    const instance = this.instances.get(adUnitId);
    if (!instance) {
      this.emitAdEvent(adUnitId, 'error', 'Ad not registered');
      return Promise.resolve(false);
    }

    instance.status = 'loading';

    // 微信/抖音小程序
    if (this.platform?.createRewardedVideoAd) {
      return this.loadMiniGameAd(instance);
    }

    // 浏览器环境（模拟）
    return new Promise((resolve) => {
      setTimeout(() => {
        instance.status = 'loaded';
        instance.loadedAt = Date.now();
        this.emitAdEvent(adUnitId, 'loaded');
        resolve(true);
      }, 500);
    });
  }

  /** 展示广告 */
  show(adUnitId: string): Promise<boolean> {
    const instance = this.instances.get(adUnitId);
    if (!instance) {
      this.emitAdEvent(adUnitId, 'error', 'Ad not registered');
      return Promise.resolve(false);
    }

    // 检查展示间隔
    const config = instance.config;
    if (config.showInterval && instance.lastShowTime > 0) {
      const elapsed = (Date.now() - instance.lastShowTime) / 1000;
      if (elapsed < config.showInterval) {
        this.emitAdEvent(adUnitId, 'skip', 'Show interval not reached');
        return Promise.resolve(false);
      }
    }

    // 检查最大展示次数
    if (config.maxShowCount && instance.showCount >= config.maxShowCount) {
      this.emitAdEvent(adUnitId, 'skip', 'Max show count reached');
      return Promise.resolve(false);
    }

    // 检查是否已加载
    if (instance.status !== 'loaded') {
      this.emitAdEvent(adUnitId, 'error', 'Ad not loaded');
      return Promise.resolve(false);
    }

    instance.status = 'showing';
    instance.showCount++;
    instance.lastShowTime = Date.now();
    this.emitAdEvent(adUnitId, 'shown');

    // 微信/抖音小程序
    if (this.platform?.createRewardedVideoAd) {
      return this.showMiniGameAd(instance);
    }

    // 浏览器环境（模拟）
    return new Promise((resolve) => {
      setTimeout(() => {
        instance.status = 'hidden';
        this.emitAdEvent(adUnitId, 'closed');
        resolve(true);
      }, 2000);
    });
  }

  /** 展示激励视频 */
  showRewarded(adUnitId: string, rewardType = 'coin', rewardAmount = 1): Promise<boolean> {
    return new Promise((resolve) => {
      const instance = this.instances.get(adUnitId);
      if (!instance) {
        this.emitAdEvent(adUnitId, 'error', 'Ad not registered');
        resolve(false);
        return;
      }

      this.show(adUnitId).then((shown) => {
        if (shown) {
          // 模拟奖励回调
          setTimeout(() => {
            this.emitAdEvent(adUnitId, 'rewarded', undefined, rewardType, rewardAmount);
            resolve(true);
          }, 2000);
        } else {
          resolve(false);
        }
      });
    });
  }

  /** 预加载所有广告 */
  async preloadAll(): Promise<void> {
    const promises: Promise<boolean>[] = [];
    for (const [adUnitId] of this.instances) {
      promises.push(this.load(adUnitId));
    }
    await Promise.all(promises);
  }

  /** 销毁广告 */
  destroy(adUnitId: string): void {
    this.instances.delete(adUnitId);
    this.adConfigs.delete(adUnitId);
  }

  /** 销毁所有广告 */
  destroyAll(): void {
    this.instances.clear();
    this.adConfigs.clear();
  }

  /** 获取广告状态 */
  getStatus(adUnitId: string): AdStatus | null {
    return this.instances.get(adUnitId)?.status ?? null;
  }

  /** 获取所有广告状态 */
  getAllStatus(): Map<string, AdStatus> {
    const result = new Map<string, AdStatus>();
    for (const [id, instance] of this.instances) {
      result.set(id, instance.status);
    }
    return result;
  }

  /** 是否可以展示广告 */
  canShow(adUnitId: string): boolean {
    const instance = this.instances.get(adUnitId);
    if (!instance) return false;
    if (instance.status !== 'loaded') return false;

    const config = instance.config;
    if (config.showInterval && instance.lastShowTime > 0) {
      const elapsed = (Date.now() - instance.lastShowTime) / 1000;
      if (elapsed < config.showInterval) return false;
    }
    if (config.maxShowCount && instance.showCount >= config.maxShowCount) return false;

    return true;
  }

  /** 监听广告事件 */
  onAdEvent(callback: (event: AdEvent) => void): () => void {
    this.on('ad:event', callback as any);
    return () => this.off('ad:event', callback as any);
  }

  /** 监听激励奖励 */
  onRewarded(callback: (adUnitId: string, type: string, amount: number) => void): () => void {
    this.on('ad:rewarded', callback as any);
    return () => this.off('ad:rewarded', callback as any);
  }

  private emitAdEvent(
    adUnitId: string,
    event: AdEvent['event'],
    error?: string,
    rewardType?: string,
    rewardAmount?: number
  ): void {
    const instance = this.instances.get(adUnitId);
    const adEvent: AdEvent = {
      type: instance?.config.type ?? 'banner',
      adUnitId,
      event,
      error,
      rewardType,
      rewardAmount,
      timestamp: Date.now(),
    };

    this.emit('ad:event', adEvent);

    if (event === 'rewarded') {
      this.emit('ad:rewarded', adUnitId, rewardType, rewardAmount);
    }
  }

  private async loadMiniGameAd(instance: AdInstance): Promise<boolean> {
    try {
      const ad = this.platform.createRewardedVideoAd({
        adUnitId: instance.config.adUnitId,
      });

      return new Promise((resolve) => {
        ad.onLoad(() => {
          instance.status = 'loaded';
          instance.loadedAt = Date.now();
          this.emitAdEvent(instance.config.adUnitId, 'loaded');
          resolve(true);
        });

        ad.onError((err: any) => {
          instance.status = 'error';
          this.emitAdEvent(instance.config.adUnitId, 'error', err.errMsg);
          resolve(false);
        });

        // 超时
        setTimeout(() => {
          if (instance.status === 'loading') {
            instance.status = 'error';
            this.emitAdEvent(instance.config.adUnitId, 'error', 'Load timeout');
            resolve(false);
          }
        }, instance.config.loadTimeout ?? 10000);
      });
    } catch (err) {
      instance.status = 'error';
      this.emitAdEvent(instance.config.adUnitId, 'error', String(err));
      return false;
    }
  }

  private async showMiniGameAd(instance: AdInstance): Promise<boolean> {
    try {
      const ad = this.platform.createRewardedVideoAd({
        adUnitId: instance.config.adUnitId,
      });

      return new Promise((resolve) => {
        ad.show().catch(() => {
          instance.status = 'error';
          this.emitAdEvent(instance.config.adUnitId, 'error', 'Show failed');
          resolve(false);
        });

        ad.onClose((res: any) => {
          instance.status = 'hidden';
          if (res?.isEnded) {
            this.emitAdEvent(instance.config.adUnitId, 'rewarded', undefined, 'default', 1);
          }
          this.emitAdEvent(instance.config.adUnitId, 'closed');
          resolve(res?.isEnded ?? false);
        });
      });
    } catch (err) {
      instance.status = 'error';
      this.emitAdEvent(instance.config.adUnitId, 'error', String(err));
      return false;
    }
  }
}

// ========== 预设广告配置 ==========

/** 创建激励视频广告配置 */
export function createRewardedAdConfig(adUnitId: string, options?: Partial<AdConfig>): AdConfig {
  return {
    adUnitId,
    type: 'rewarded',
    autoLoad: true,
    loadTimeout: 10000,
    ...options,
  };
}

/** 创建插屏广告配置 */
export function createInterstitialAdConfig(adUnitId: string, options?: Partial<AdConfig>): AdConfig {
  return {
    adUnitId,
    type: 'interstitial',
    autoLoad: false,
    showInterval: 60,
    ...options,
  };
}

/** 创建横幅广告配置 */
export function createBannerAdConfig(adUnitId: string, options?: Partial<AdConfig>): AdConfig {
  return {
    adUnitId,
    type: 'banner',
    position: 'bottom',
    width: 320,
    height: 50,
    ...options,
  };
}
