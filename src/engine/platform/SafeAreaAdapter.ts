// 微信/抖音小程序安全区适配模块
// 自动识别平台，获取安全区域，提供统一的适配方案

/** 平台类型 */
export type MiniAppPlatform = 'wechat' | 'douyin' | 'unknown';

/** 安全区域信息 */
export interface SafeAreaInfo {
  /** 顶部安全高度（状态栏 + 导航栏） */
  top: number;
  /** 底部安全高度（iPhone X 等全面屏） */
  bottom: number;
  /** 左侧安全宽度 */
  left: number;
  /** 右侧安全宽度 */
  right: number;
  /** 状态栏高度 */
  statusBarHeight: number;
  /** 导航栏高度 */
  navigationBarHeight: number;
  /** 是否为刘海屏 */
  hasNotch: boolean;
  /** 屏幕宽度 */
  screenWidth: number;
  /** 屏幕高度 */
  screenHeight: number;
  /** 内容区域高度（屏幕高度 - 顶部安全区 - 底部安全区） */
  contentHeight: number;
  /** 内容区域Y坐标起始点 */
  contentTop: number;
}

/** 返回按钮配置 */
export interface BackButtonConfig {
  /** 是否显示返回按钮 */
  show: boolean;
  /** 按钮文本 */
  text?: string;
  /** 按钮图标（Unicode或emoji） */
  icon?: string;
  /** 按钮X坐标 */
  x?: number;
  /** 按钮Y坐标 */
  y?: number;
  /** 按钮宽度 */
  width?: number;
  /** 按钮高度 */
  height?: number;
  /** 文本颜色 */
  textColor?: string;
  /** 背景色 */
  backgroundColor?: string;
  /** 背景透明度 */
  backgroundAlpha?: number;
  /** 字体大小 */
  fontSize?: number;
  /** 点击回调 */
  onClick?: () => void;
}

/** 标题栏配置 */
export interface TitleBarConfig {
  /** 是否显示标题栏 */
  show: boolean;
  /** 标题文本 */
  title?: string;
  /** 副标题 */
  subtitle?: string;
  /** 标题颜色 */
  titleColor?: string;
  /** 副标题颜色 */
  subtitleColor?: string;
  /** 标题字体大小 */
  titleFontSize?: number;
  /** 副标题字体大小 */
  subtitleFontSize?: number;
  /** 标题栏背景色 */
  backgroundColor?: string;
  /** 标题栏背景透明度 */
  backgroundAlpha?: number;
}

/** 完整配置 */
export interface SafeAreaAdapterConfig {
  /** 返回按钮配置 */
  backButton?: BackButtonConfig;
  /** 标题栏配置 */
  titleBar?: TitleBarConfig;
  /** 是否自动适配 */
  autoAdapt?: boolean;
  /** 调试模式 */
  debug?: boolean;
}

/** 默认配置 */
const DEFAULT_CONFIG: SafeAreaAdapterConfig = {
  backButton: {
    show: true,
    text: '返回',
    icon: '←',
    textColor: '#ffffff',
    backgroundColor: 'rgba(0,0,0,0.3)',
    backgroundAlpha: 1,
    fontSize: 14,
    width: 60,
    height: 30,
  },
  titleBar: {
    show: true,
    title: '',
    titleColor: '#ffffff',
    subtitleColor: '#cccccc',
    titleFontSize: 17,
    subtitleFontSize: 12,
    backgroundColor: '#000000',
    backgroundAlpha: 0,
  },
  autoAdapt: true,
  debug: false,
};

/**
 * 小程序安全区适配器
 */
export class SafeAreaAdapter {
  private platform: MiniAppPlatform;
  private safeArea: SafeAreaInfo;
  private config: SafeAreaAdapterConfig;

  constructor(config?: Partial<SafeAreaAdapterConfig>) {
    this.config = this.mergeConfig(DEFAULT_CONFIG, config);
    this.platform = this.detectPlatform();
    this.safeArea = this.detectSafeArea();

    if (this.config.debug) {
      console.log('[SafeAreaAdapter] platform:', this.platform);
      console.log('[SafeAreaAdapter] safeArea:', this.safeArea);
    }
  }

  /**
   * 检测当前平台
   */
  private detectPlatform(): MiniAppPlatform {
    if (typeof wx !== 'undefined' && typeof wx.getSystemInfoSync === 'function') {
      return 'wechat';
    }
    if (typeof tt !== 'undefined' && typeof tt.getSystemInfoSync === 'function') {
      return 'douyin';
    }
    return 'unknown';
  }

  /**
   * 检测安全区域
   */
  private detectSafeArea(): SafeAreaInfo {
    const defaultArea: SafeAreaInfo = {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      statusBarHeight: 0,
      navigationBarHeight: 0,
      hasNotch: false,
      screenWidth: 375,
      screenHeight: 667,
      contentHeight: 667,
      contentTop: 0,
    };

    if (this.platform === 'wechat') {
      return this.detectWechatSafeArea(defaultArea);
    }

    if (this.platform === 'douyin') {
      return this.detectDouyinSafeArea(defaultArea);
    }

    // H5端尝试获取
    return this.detectH5SafeArea(defaultArea);
  }

  /**
   * 检测微信安全区域
   */
  private detectWechatSafeArea(defaultArea: SafeAreaInfo): SafeAreaInfo {
    try {
      const info = wx.getSystemInfoSync() as any;
      const statusBarHeight = info.statusBarHeight || 20;
      const isIOS = info.platform === 'ios';
      const navigationBarHeight = isIOS ? 44 : 48;
      const safeArea = info.safeArea;

      const safeAreaTop = safeArea ? safeArea.top : statusBarHeight + navigationBarHeight;
      const safeAreaBottom = safeArea ? (info.screenHeight - safeArea.bottom) : 0;
      const hasNotch = safeAreaTop > statusBarHeight + navigationBarHeight;

      return {
        top: safeAreaTop,
        bottom: safeAreaBottom,
        left: safeArea ? safeArea.left : 0,
        right: safeArea ? (info.screenWidth - safeArea.right) : 0,
        statusBarHeight,
        navigationBarHeight,
        hasNotch,
        screenWidth: info.screenWidth || 375,
        screenHeight: info.screenHeight || 667,
        contentHeight: (info.screenHeight || 667) - safeAreaTop - safeAreaBottom,
        contentTop: safeAreaTop,
      };
    } catch (e) {
      console.warn('[SafeAreaAdapter] Failed to detect WeChat safe area:', e);
      return defaultArea;
    }
  }

  /**
   * 检测抖音安全区域
   */
  private detectDouyinSafeArea(defaultArea: SafeAreaInfo): SafeAreaInfo {
    try {
      const info = tt.getSystemInfoSync() as any;
      const statusBarHeight = info.statusBarHeight || 20;
      const isIOS = info.platform === 'ios';
      const navigationBarHeight = isIOS ? 44 : 48;
      const safeArea = info.safeArea;

      const safeAreaTop = safeArea ? safeArea.top : statusBarHeight + navigationBarHeight;
      const safeAreaBottom = safeArea ? (info.screenHeight - safeArea.bottom) : 0;
      const hasNotch = safeAreaTop > statusBarHeight + navigationBarHeight;

      return {
        top: safeAreaTop,
        bottom: safeAreaBottom,
        left: safeArea ? safeArea.left : 0,
        right: safeArea ? (info.screenWidth - safeArea.right) : 0,
        statusBarHeight,
        navigationBarHeight,
        hasNotch,
        screenWidth: info.screenWidth || 375,
        screenHeight: info.screenHeight || 667,
        contentHeight: (info.screenHeight || 667) - safeAreaTop - safeAreaBottom,
        contentTop: safeAreaTop,
      };
    } catch (e) {
      console.warn('[SafeAreaAdapter] Failed to detect Douyin safe area:', e);
      return defaultArea;
    }
  }

  /**
   * 检测H5安全区域
   */
  private detectH5SafeArea(defaultArea: SafeAreaInfo): SafeAreaInfo {
    try {
      if (typeof window === 'undefined') return defaultArea;

      const computedStyle = getComputedStyle(document.documentElement);
      // env() 是 CSS 函数，不能通过 getPropertyValue 直接获取
      // 使用 CSS 变量作为中介
      const safeAreaTop = parseInt(computedStyle.getPropertyValue('--sat') || '0', 10);
      const safeAreaBottom = parseInt(computedStyle.getPropertyValue('--sab') || '0', 10);
      const safeAreaLeft = parseInt(computedStyle.getPropertyValue('--sal') || '0', 10);
      const safeAreaRight = parseInt(computedStyle.getPropertyValue('--sar') || '0', 10);

      return {
        top: safeAreaTop,
        bottom: safeAreaBottom,
        left: safeAreaLeft,
        right: safeAreaRight,
        statusBarHeight: 0,
        navigationBarHeight: 0,
        hasNotch: safeAreaTop > 20,
        screenWidth: window.innerWidth || 375,
        screenHeight: window.innerHeight || 667,
        contentHeight: (window.innerHeight || 667) - safeAreaTop - safeAreaBottom,
        contentTop: safeAreaTop,
      };
    } catch (e) {
      return defaultArea;
    }
  }

  /**
   * 深度合并配置
   */
  private mergeConfig(target: any, source: any): any {
    if (!source) return target;
    const result = { ...target };
    for (const key in source) {
      if (source[key] !== undefined) {
        if (typeof source[key] === 'object' && !Array.isArray(source[key]) && source[key] !== null) {
          result[key] = this.mergeConfig(target[key] || {}, source[key]);
        } else {
          result[key] = source[key];
        }
      }
    }
    return result;
  }

  /**
   * 获取平台类型
   */
  getPlatform(): MiniAppPlatform {
    return this.platform;
  }

  /**
   * 获取安全区域信息
   */
  getSafeArea(): SafeAreaInfo {
    return { ...this.safeArea };
  }

  /**
   * 获取顶部安全高度
   */
  getTopHeight(): number {
    return this.safeArea.top;
  }

  /**
   * 获取底部安全高度
   */
  getBottomHeight(): number {
    return this.safeArea.bottom;
  }

  /**
   * 获取内容区域高度
   */
  getContentHeight(): number {
    return this.safeArea.contentHeight;
  }

  /**
   * 获取内容区域起始Y坐标
   */
  getContentTop(): number {
    return this.safeArea.contentTop;
  }

  /**
   * 是否为刘海屏
   */
  hasNotch(): boolean {
    return this.safeArea.hasNotch;
  }

  /**
   * 获取状态栏高度
   */
  getStatusBarHeight(): number {
    return this.safeArea.statusBarHeight;
  }

  /**
   * 获取导航栏高度
   */
  getNavigationBarHeight(): number {
    return this.safeArea.navigationBarHeight;
  }

  /**
   * 将原始坐标转换为内容区域坐标
   */
  transformPoint(x: number, y: number): { x: number; y: number } {
    return {
      x: x - this.safeArea.left,
      y: y - this.safeArea.top,
    };
  }

  /**
   * 渲染安全区域背景
   */
  renderBackground(ctx: CanvasRenderingContext2D, color: string = '#000000', alpha: number = 0): void {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, this.safeArea.screenWidth, this.safeArea.top);
    ctx.restore();
  }

  /**
   * 渲染返回按钮
   */
  renderBackButton(ctx: CanvasRenderingContext2D, customConfig?: Partial<BackButtonConfig>): void {
    const btnConfig = { ...this.config.backButton, ...customConfig };
    if (!btnConfig.show) return;

    const x = btnConfig.x ?? 12;
    const y = btnConfig.y ?? this.safeArea.statusBarHeight + (this.safeArea.navigationBarHeight - (btnConfig.height ?? 30)) / 2;
    const w = btnConfig.width ?? 60;
    const h = btnConfig.height ?? 30;
    const r = h / 2;

    // 绘制背景
    ctx.save();
    ctx.globalAlpha = btnConfig.backgroundAlpha ?? 1;
    ctx.fillStyle = btnConfig.backgroundColor ?? 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 绘制图标和文本
    ctx.save();
    ctx.fillStyle = btnConfig.textColor ?? '#ffffff';
    ctx.font = `${btnConfig.fontSize ?? 14}px -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const icon = btnConfig.icon ?? '←';
    const text = btnConfig.text ?? '返回';
    ctx.fillText(`${icon} ${text}`, x + w / 2, y + h / 2);
    ctx.restore();
  }

  /**
   * 渲染标题栏
   */
  renderTitleBar(ctx: CanvasRenderingContext2D, customConfig?: Partial<TitleBarConfig>): void {
    const titleConfig = { ...this.config.titleBar, ...customConfig };
    if (!titleConfig.show) return;

    const barHeight = this.safeArea.navigationBarHeight;
    const barY = this.safeArea.statusBarHeight;

    // 绘制背景
    ctx.save();
    ctx.globalAlpha = titleConfig.backgroundAlpha ?? 0;
    ctx.fillStyle = titleConfig.backgroundColor ?? '#000000';
    ctx.fillRect(0, barY, this.safeArea.screenWidth, barHeight);
    ctx.restore();

    // 绘制标题
    if (titleConfig.title) {
      ctx.save();
      ctx.fillStyle = titleConfig.titleColor ?? '#ffffff';
      ctx.font = `bold ${titleConfig.titleFontSize ?? 17}px -apple-system, BlinkMacSystemFont, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(titleConfig.title, this.safeArea.screenWidth / 2, barY + barHeight / 2 - (titleConfig.subtitle ? 8 : 0));
      ctx.restore();
    }

    // 绘制副标题
    if (titleConfig.subtitle) {
      ctx.save();
      ctx.fillStyle = titleConfig.subtitleColor ?? '#cccccc';
      ctx.font = `${titleConfig.subtitleFontSize ?? 12}px -apple-system, BlinkMacSystemFont, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(titleConfig.subtitle, this.safeArea.screenWidth / 2, barY + barHeight / 2 + 12);
      ctx.restore();
    }
  }

  /**
   * 渲染完整的导航栏（背景 + 返回按钮 + 标题）
   */
  renderNavigationBar(ctx: CanvasRenderingContext2D, options?: {
    backgroundColor?: string;
    backgroundAlpha?: number;
    backButton?: Partial<BackButtonConfig>;
    titleBar?: Partial<TitleBarConfig>;
  }): void {
    // 渲染背景
    this.renderBackground(ctx, options?.backgroundColor, options?.backgroundAlpha);

    // 渲染返回按钮
    this.renderBackButton(ctx, options?.backButton);

    // 渲染标题栏
    this.renderTitleBar(ctx, options?.titleBar);
  }

  /**
   * 获取返回按钮的点击区域（用于触摸检测）
   */
  getBackButtonRect(customConfig?: Partial<BackButtonConfig>): { x: number; y: number; width: number; height: number } {
    const btnConfig = { ...this.config.backButton, ...customConfig };
    return {
      x: btnConfig.x ?? 12,
      y: btnConfig.y ?? this.safeArea.statusBarHeight + (this.safeArea.navigationBarHeight - (btnConfig.height ?? 30)) / 2,
      width: btnConfig.width ?? 60,
      height: btnConfig.height ?? 30,
    };
  }

  /**
   * 检测点是否在返回按钮内
   */
  isPointInBackButton(x: number, y: number, customConfig?: Partial<BackButtonConfig>): boolean {
    const rect = this.getBackButtonRect(customConfig);
    return x >= rect.x && x <= rect.x + rect.width &&
           y >= rect.y && y <= rect.y + rect.height;
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<SafeAreaAdapterConfig>): void {
    this.config = this.mergeConfig(this.config, config);
  }

  /**
   * 刷新安全区域信息（用于屏幕旋转等场景）
   */
  refresh(): void {
    this.safeArea = this.detectSafeArea();
  }
}

/**
 * 创建安全区适配器实例
 */
export function createSafeAreaAdapter(config?: Partial<SafeAreaAdapterConfig>): SafeAreaAdapter {
  return new SafeAreaAdapter(config);
}