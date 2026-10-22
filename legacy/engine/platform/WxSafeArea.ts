// 微信安全区域适配模块：处理微信小程序顶部导航栏和底部安全区域
import { ScreenInfo } from '../platform/Platform';

/** 微信安全区域信息 */
export interface WxSafeArea {
  /** 顶部安全高度（状态栏 + 导航栏） */
  top: number;
  /** 底部安全高度（iPhone X 等全面屏） */
  bottom: number;
  /** 左侧安全宽度（横屏时使用） */
  left: number;
  /** 右侧安全宽度（横屏时使用） */
  right: number;
  /** 状态栏高度 */
  statusBarHeight: number;
  /** 导航栏高度 */
  navigationBarHeight: number;
  /** 是否有刘海屏 */
  hasNotch: boolean;
}

/** 平台类型 */
export type PlatformType = 'wechat' | 'douyin' | 'h5' | 'unknown';

/**
 * 获取当前平台类型
 */
export function getPlatformType(): PlatformType {
  if (typeof wx !== 'undefined' && typeof wx.getSystemInfoSync === 'function') {
    return 'wechat';
  }
  if (typeof tt !== 'undefined' && typeof tt.getSystemInfoSync === 'function') {
    return 'douyin';
  }
  if (typeof window !== 'undefined') {
    return 'h5';
  }
  return 'unknown';
}

/**
 * 获取微信安全区域信息
 * 微信小程序中，顶部状态栏+导航栏会遮挡游戏内容
 * 需要获取安全区域高度，调整游戏渲染区域
 */
export function getWxSafeArea(): WxSafeArea {
  const defaultArea: WxSafeArea = {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    statusBarHeight: 0,
    navigationBarHeight: 0,
    hasNotch: false,
  };

  const platform = getPlatformType();

  if (platform === 'wechat') {
    try {
      const info = wx.getSystemInfoSync();
      const systemInfo = info as any;
      
      // 获取状态栏高度
      const statusBarHeight = systemInfo.statusBarHeight || 20;
      
      // 微信默认导航栏高度为 44px（iOS）或 48px（Android）
      const isIOS = systemInfo.platform === 'ios';
      const navigationBarHeight = isIOS ? 44 : 48;
      
      // 获取安全区域（如果有）
      const safeArea = systemInfo.safeArea;
      const safeAreaTop = safeArea ? safeArea.top : statusBarHeight + navigationBarHeight;
      const safeAreaBottom = safeArea ? (systemInfo.screenHeight - safeArea.bottom) : 0;
      
      // 判断是否为刘海屏
      const hasNotch = safeAreaTop > statusBarHeight + navigationBarHeight;
      
      return {
        top: safeAreaTop,
        bottom: safeAreaBottom,
        left: safeArea ? safeArea.left : 0,
        right: safeArea ? (systemInfo.screenWidth - safeArea.right) : 0,
        statusBarHeight,
        navigationBarHeight,
        hasNotch,
      };
    } catch (e) {
      console.warn('getWxSafeArea: failed to get system info', e);
      return defaultArea;
    }
  }

  if (platform === 'douyin') {
    try {
      const info = tt.getSystemInfoSync();
      const systemInfo = info as any;
      
      // 获取状态栏高度
      const statusBarHeight = systemInfo.statusBarHeight || 20;
      
      // 抖音默认导航栏高度为 44px（iOS）或 48px（Android）
      const isIOS = systemInfo.platform === 'ios';
      const navigationBarHeight = isIOS ? 44 : 48;
      
      // 获取安全区域（如果有）
      const safeArea = systemInfo.safeArea;
      const safeAreaTop = safeArea ? safeArea.top : statusBarHeight + navigationBarHeight;
      const safeAreaBottom = safeArea ? (systemInfo.screenHeight - safeArea.bottom) : 0;
      
      // 判断是否为刘海屏
      const hasNotch = safeAreaTop > statusBarHeight + navigationBarHeight;
      
      return {
        top: safeAreaTop,
        bottom: safeAreaBottom,
        left: safeArea ? safeArea.left : 0,
        right: safeArea ? (systemInfo.screenWidth - safeArea.right) : 0,
        statusBarHeight,
        navigationBarHeight,
        hasNotch,
      };
    } catch (e) {
      console.warn('getWxSafeArea: failed to get system info', e);
      return defaultArea;
    }
  }

  // H5 端尝试获取安全区域
  if (platform === 'h5') {
    try {
      // 使用 CSS 变量获取安全区域（env() 是 CSS 函数，不能通过 getPropertyValue 直接获取）
      const computedStyle = getComputedStyle(document.documentElement);
      const safeAreaTop = parseInt(computedStyle.getPropertyValue('--sat') || '0', 10);
      const safeAreaBottom = parseInt(computedStyle.getPropertyValue('--sab') || '0', 10);
      
      return {
        top: safeAreaTop,
        bottom: safeAreaBottom,
        left: parseInt(computedStyle.getPropertyValue('--sal') || '0', 10),
        right: parseInt(computedStyle.getPropertyValue('--sar') || '0', 10),
        statusBarHeight: 0,
        navigationBarHeight: 0,
        hasNotch: safeAreaTop > 20,
      };
    } catch (e) {
      return defaultArea;
    }
  }

  return defaultArea;
}

/**
 * 微信导航栏适配器
 * 用于调整游戏内容区域，避免被微信导航栏遮挡
 */
export class WxNavigationAdapter {
  private safeArea: WxSafeArea;
  private platform: PlatformType;
  private enabled: boolean;

  constructor() {
    this.platform = getPlatformType();
    this.safeArea = getWxSafeArea();
    this.enabled = this.platform === 'wechat' || this.platform === 'douyin';
  }

  /**
   * 获取适配后的屏幕信息
   * 将安全区域从屏幕尺寸中扣除
   */
  getAdaptedScreenInfo(original: ScreenInfo): ScreenInfo {
    if (!this.enabled) {
      return original;
    }

    return {
      width: original.width,
      height: original.height - this.safeArea.top - this.safeArea.bottom,
      pixelRatio: original.pixelRatio,
    };
  }

  /**
   * 获取内容区域的偏移量
   * 用于调整渲染起点
   */
  getContentOffset(): { x: number; y: number } {
    if (!this.enabled) {
      return { x: 0, y: 0 };
    }
    return {
      x: this.safeArea.left,
      y: this.safeArea.top,
    };
  }

  /**
   * 将原始触摸坐标转换为内容区域坐标
   */
  transformTouchPoint(x: number, y: number): { x: number; y: number } {
    if (!this.enabled) {
      return { x, y };
    }
    return {
      x: x - this.safeArea.left,
      y: y - this.safeArea.top,
    };
  }

  /**
   * 获取安全区域信息
   */
  getSafeArea(): WxSafeArea {
    return { ...this.safeArea };
  }

  /**
   * 获取顶部安全高度
   */
  getTopSafeHeight(): number {
    return this.safeArea.top;
  }

  /**
   * 获取底部安全高度
   */
  getBottomSafeHeight(): number {
    return this.safeArea.bottom;
  }

  /**
   * 是否为刘海屏
   */
  hasNotch(): boolean {
    return this.safeArea.hasNotch;
  }

  /**
   * 是否为微信平台
   */
  isWechat(): boolean {
    return this.platform === 'wechat';
  }

  /**
   * 是否为抖音平台
   */
  isDouyin(): boolean {
    return this.platform === 'douyin';
  }

  /**
   * 是否启用安全区域适配
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * 手动设置安全区域（用于测试或自定义）
   */
  setSafeArea(area: Partial<WxSafeArea>): void {
    this.safeArea = { ...this.safeArea, ...area };
  }

  /**
   * 刷新安全区域信息
   */
  refresh(): void {
    this.safeArea = getWxSafeArea();
  }
}

/**
 * 全局微信导航栏适配器实例
 */
let globalAdapter: WxNavigationAdapter | null = null;

/**
 * 获取全局微信导航栏适配器
 */
export function getWxNavigationAdapter(): WxNavigationAdapter {
  if (!globalAdapter) {
    globalAdapter = new WxNavigationAdapter();
  }
  return globalAdapter;
}

/**
 * 重置全局适配器（用于测试）
 */
export function resetWxNavigationAdapter(): void {
  globalAdapter = null;
}