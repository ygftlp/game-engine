// 移动端通用事件：应用生命周期、屏幕方向、网络状态、电池、传感器、手势等。

import { EventEmitter } from '../core/EventEmitter';

/** 应用生命周期状态 */
export type AppLifecycleState = 'active' | 'background' | 'inactive';

/** 屏幕方向 */
export type ScreenOrientation = 'portrait' | 'portrait-upside-down' | 'landscape-left' | 'landscape-right' | 'unknown';

/** 网络类型 */
export type NetworkType = 'wifi' | '4g' | '3g' | '2g' | 'none' | 'unknown';

/** 网络状态 */
export interface NetworkStatus {
  /** 是否联网 */
  isConnected: boolean;
  /** 网络类型 */
  type: NetworkType;
  /** 网络速度（Mbps） */
  speed?: number;
}

/** 电池状态 */
export interface BatteryStatus {
  /** 电量 0-1 */
  level: number;
  /** 是否正在充电 */
  isCharging: boolean;
  /** 充电时间（秒） */
  chargingTime?: number;
  /** 剩余时间（秒） */
  dischargingTime?: number;
}

/** 设备信息 */
export interface DeviceInfo {
  /** 品牌 */
  brand: string;
  /** 型号 */
  model: string;
  /** 系统版本 */
  system: string;
  /** 屏幕宽度（px） */
  screenWidth: number;
  /** 屏幕高度（px） */
  screenHeight: number;
  /** 像素比 */
  pixelRatio: number;
  /** 语言 */
  language: string;
  /** 平台 */
  platform: string;
}

/** 触摸手势类型 */
export type GestureType = 'tap' | 'double-tap' | 'long-press' | 'swipe' | 'pinch' | 'pan' | 'rotate';

/** 手势事件数据 */
export interface GestureEvent {
  /** 手势类型 */
  type: GestureType;
  /** 中心点位置 */
  centerX: number;
  centerY: number;
  /** 移动距离 */
  deltaX: number;
  deltaY: number;
  /** 移动速度（px/s） */
  velocityX: number;
  velocityY: number;
  /** 缩放比例（pinch） */
  scale?: number;
  /** 旋转角度（rotate） */
  rotation?: number;
  /** 滑动方向 */
  direction?: 'up' | 'down' | 'left' | 'right';
  /** 触摸点数量 */
  touchCount: number;
  /** 持续时间（ms） */
  duration: number;
}

/** 摇一摇事件数据 */
export interface ShakeEvent {
  /** 加速度 */
  acceleration: { x: number; y: number; z: number };
  /** 加速度（含重力） */
  accelerationIncludingGravity: { x: number; y: number; z: number };
  /** 时间戳 */
  timestamp: number;
}

/** 剪贴板事件数据 */
export interface ClipboardEvent {
  /** 操作类型 */
  type: 'copy' | 'paste' | 'cut';
  /** 剪贴板内容 */
  data: string;
}

/** 键盘事件数据 */
export interface KeyboardEvent {
  /** 按键码 */
  keyCode: number;
  /** 按键名 */
  key: string;
  /** 是否按下 */
  type: 'keydown' | 'keyup';
  /** 是否按住修饰键 */
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  metaKey: boolean;
}

/**
 * 移动端事件管理器
 * 
 * 使用示例：
 *   const mobile = new MobileEventManager(platform);
 *   
 *   mobile.onAppShow(() => console.log('应用回到前台'));
 *   mobile.onAppHide(() => console.log('应用进入后台'));
 *   mobile.onNetworkChange((status) => console.log('网络变化:', status));
 *   mobile.onBatteryChange((status) => console.log('电量:', status.level));
 *   mobile.onShake((e) => console.log('摇一摇'));
 *   mobile.onGesture((e) => console.log('手势:', e.type));
 */
export class MobileEventManager {
  private emitter = new EventEmitter();
  private platform: any;
  private shakeThreshold = 15;
  private lastShakeTime = 0;
  private shakeCooldown = 1000;

  constructor(platform?: any) {
    this.platform = platform;
    this.initLifecycle();
  }

  // ========== 应用生命周期 ==========

  /** 监听应用显示（从后台回到前台） */
  onAppShow(callback: () => void): () => void {
    this.emitter.on('app:show', callback);
    return () => this.emitter.off('app:show', callback);
  }

  /** 监听应用隐藏（进入后台） */
  onAppHide(callback: () => void): () => void {
    this.emitter.on('app:hide', callback);
    return () => this.emitter.off('app:hide', callback);
  }

  /** 监听应用暂停 */
  onAppPause(callback: () => void): () => void {
    this.emitter.on('app:pause', callback);
    return () => this.emitter.off('app:pause', callback);
  }

  /** 监听应用恢复 */
  onAppResume(callback: () => void): () => void {
    this.emitter.on('app:resume', callback);
    return () => this.emitter.off('app:resume', callback);
  }

  // ========== 屏幕方向 ==========

  /** 监听屏幕方向变化 */
  onOrientationChange(callback: (orientation: ScreenOrientation) => void): () => void {
    this.emitter.on('orientation:change', callback as any);
    return () => this.emitter.off('orientation:change', callback as any);
  }

  /** 获取当前屏幕方向 */
  getOrientation(): ScreenOrientation {
    if (typeof window !== 'undefined' && window.screen?.orientation) {
      const type = window.screen.orientation.type;
      if (type.includes('portrait')) return 'portrait';
      if (type.includes('landscape')) return 'landscape-left';
    }
    return 'unknown';
  }

  // ========== 网络状态 ==========

  /** 监听网络状态变化 */
  onNetworkChange(callback: (status: NetworkStatus) => void): () => void {
    this.emitter.on('network:change', callback as any);
    return () => this.emitter.off('network:change', callback as any);
  }

  /** 监听网络断开 */
  onNetworkOffline(callback: () => void): () => void {
    this.emitter.on('network:offline', callback as any);
    return () => this.emitter.off('network:offline', callback as any);
  }

  /** 监听网络恢复 */
  onNetworkOnline(callback: () => void): () => void {
    this.emitter.on('network:online', callback as any);
    return () => this.emitter.off('network:online', callback as any);
  }

  /** 获取网络状态 */
  getNetworkStatus(): NetworkStatus {
    if (typeof navigator !== 'undefined' && navigator.onLine !== undefined) {
      const connection = (navigator as any).connection;
      return {
        isConnected: navigator.onLine,
        type: connection?.type ?? 'unknown',
        speed: connection?.downlink,
      };
    }
    // 小程序环境
    if (this.platform?.getNetworkType) {
      return this.platform.getNetworkType();
    }
    return { isConnected: true, type: 'unknown' };
  }

  // ========== 电池状态 ==========

  /** 监听电池状态变化 */
  onBatteryChange(callback: (status: BatteryStatus) => void): () => void {
    this.emitter.on('battery:change', callback as any);
    return () => this.emitter.off('battery:change', callback as any);
  }

  /** 监听低电量 */
  onLowBattery(callback: (level: number) => void, threshold = 0.2): () => void {
    return this.onBatteryChange((status) => {
      if (status.level <= threshold) {
        callback(status.level);
      }
    });
  }

  /** 获取电池状态 */
  async getBatteryStatus(): Promise<BatteryStatus> {
    if (typeof navigator !== 'undefined' && (navigator as any).getBattery) {
      const battery = await (navigator as any).getBattery();
      return {
        level: battery.level,
        isCharging: battery.charging,
        chargingTime: battery.chargingTime,
        dischargingTime: battery.dischargingTime,
      };
    }
    // 小程序环境
    if (this.platform?.getBatteryInfo) {
      return this.platform.getBatteryInfo();
    }
    return { level: 1, isCharging: false };
  }

  // ========== 设备信息 ==========

  /** 获取设备信息 */
  getDeviceInfo(): DeviceInfo {
    if (typeof window !== 'undefined') {
      return {
        brand: navigator.userAgent,
        model: navigator.platform,
        system: navigator.userAgent,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        pixelRatio: window.devicePixelRatio || 1,
        language: navigator.language,
        platform: navigator.platform,
      };
    }
    // 小程序环境
    if (this.platform?.getSystemInfoSync) {
      return this.platform.getSystemInfoSync();
    }
    return {
      brand: 'unknown',
      model: 'unknown',
      system: 'unknown',
      screenWidth: 375,
      screenHeight: 667,
      pixelRatio: 1,
      language: 'zh-CN',
      platform: 'unknown',
    };
  }

  // ========== 手势事件 ==========

  /** 监听点击 */
  onTap(callback: (x: number, y: number) => void): () => void {
    this.emitter.on('gesture:tap', (e: any) => callback(e.centerX, e.centerY));
    return () => this.emitter.off('gesture:tap', callback as any);
  }

  /** 监听双击 */
  onDoubleTap(callback: (x: number, y: number) => void): () => void {
    this.emitter.on('gesture:double-tap', (e: any) => callback(e.centerX, e.centerY));
    return () => this.emitter.off('gesture:double-tap', callback as any);
  }

  /** 监听长按 */
  onLongPress(callback: (x: number, y: number) => void, _duration = 500): () => void {
    this.emitter.on('gesture:long-press', (e: any) => callback(e.centerX, e.centerY));
    return () => this.emitter.off('gesture:long-press', callback as any);
  }

  /** 监听滑动 */
  onSwipe(callback: (direction: 'up' | 'down' | 'left' | 'right', distance: number) => void): () => void {
    this.emitter.on('gesture:swipe', (e: any) => callback(e.direction, Math.sqrt(e.deltaX * e.deltaX + e.deltaY * e.deltaY)));
    return () => this.emitter.off('gesture:swipe', callback as any);
  }

  /** 监听缩放 */
  onPinch(callback: (scale: number) => void): () => void {
    this.emitter.on('gesture:pinch', (e: any) => callback(e.scale));
    return () => this.emitter.off('gesture:pinch', callback as any);
  }

  /** 监听平移 */
  onPan(callback: (deltaX: number, deltaY: number) => void): () => void {
    this.emitter.on('gesture:pan', (e: any) => callback(e.deltaX, e.deltaY));
    return () => this.emitter.off('gesture:pan', callback as any);
  }

  /** 监听旋转 */
  onRotate(callback: (angle: number) => void): () => void {
    this.emitter.on('gesture:rotate', (e: any) => callback(e.rotation));
    return () => this.emitter.off('gesture:rotate', callback as any);
  }

  /** 监听所有手势 */
  onGesture(callback: (gesture: GestureEvent) => void): () => void {
    this.emitter.on('gesture', callback as any);
    return () => this.emitter.off('gesture', callback as any);
  }

  // ========== 传感器 ==========

  /** 监听摇一摇 */
  onShake(callback: (event: ShakeEvent) => void, threshold = 15): () => void {
    this.shakeThreshold = threshold;
    this.emitter.on('shake', callback as any);
    return () => this.emitter.off('shake', callback as any);
  }

  /** 监听设备方向（陀螺仪） */
  onDeviceOrientation(callback: (alpha: number, beta: number, gamma: number) => void): () => void {
    this.emitter.on('device:orientation', callback as any);
    return () => this.emitter.off('device:orientation', callback as any);
  }

  // ========== 剪贴板 ==========

  /** 监听剪贴板变化 */
  onClipboardChange(callback: (event: ClipboardEvent) => void): () => void {
    this.emitter.on('clipboard', callback as any);
    return () => this.emitter.off('clipboard', callback as any);
  }

  /** 复制到剪贴板 */
  async copyToClipboard(text: string): Promise<boolean> {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        return false;
      }
    }
    // 小程序环境
    if (this.platform?.setClipboardData) {
      return this.platform.setClipboardData({ data: text });
    }
    return false;
  }

  /** 从剪贴板读取 */
  async readFromClipboard(): Promise<string | null> {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        return await navigator.clipboard.readText();
      } catch {
        return null;
      }
    }
    if (this.platform?.getClipboardData) {
      return this.platform.getClipboardData();
    }
    return null;
  }

  // ========== 振动 ==========

  /** 设备振动 */
  vibrate(pattern: number | number[]): boolean {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(pattern);
      return true;
    }
    if (this.platform?.vibrateShort || this.platform?.vibrateLong) {
      if (typeof pattern === 'number' && pattern > 150) {
        this.platform.vibrateLong?.();
      } else {
        this.platform.vibrateShort?.({ type: 'medium' });
      }
      return true;
    }
    return false;
  }

  /** 短振动 */
  vibrateShort(): boolean {
    return this.vibrate(15);
  }

  /** 长振动 */
  vibrateLong(): boolean {
    return this.vibrate(400);
  }

  // ========== 屏幕常亮 ==========

  /** 设置屏幕常亮 */
  setKeepScreenOn(keepOn: boolean): boolean {
    if (this.platform?.setKeepScreenOn) {
      this.platform.setKeepScreenOn({ keepScreenOn: keepOn });
      return true;
    }
    // 浏览器环境使用 Wake Lock API
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
      // 需要用户交互后才能请求
      return true;
    }
    return false;
  }

  // ========== 全屏 ==========

  /** 请求全屏 */
  requestFullscreen(): boolean {
    if (typeof document !== 'undefined') {
      const element = document.documentElement;
      if (element.requestFullscreen) {
        element.requestFullscreen();
        return true;
      }
    }
    return false;
  }

  /** 退出全屏 */
  exitFullscreen(): boolean {
    if (typeof document !== 'undefined' && document.exitFullscreen) {
      document.exitFullscreen();
      return true;
    }
    return false;
  }

  // ========== 内部方法 ==========

  /** 初始化生命周期监听 */
  private initLifecycle(): void {
    // 浏览器环境
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', () => this.emitter.emit('app:show'));
      window.addEventListener('blur', () => this.emitter.emit('app:hide'));
      window.addEventListener('pageshow', () => this.emitter.emit('app:resume'));
      window.addEventListener('pagehide', () => this.emitter.emit('app:pause'));

      // 网络状态
      window.addEventListener('online', () => {
        this.emitter.emit('network:online');
        this.emitter.emit('network:change', this.getNetworkStatus());
      });
      window.addEventListener('offline', () => {
        this.emitter.emit('network:offline');
        this.emitter.emit('network:change', this.getNetworkStatus());
      });

      // 屏幕方向
      if (window.screen?.orientation) {
        window.screen.orientation.addEventListener('change', () => {
          this.emitter.emit('orientation:change', this.getOrientation());
        });
      }

      // 键盘
      window.addEventListener('keydown', (e) => {
        this.emitter.emit('keyboard', {
          keyCode: e.keyCode,
          key: e.key,
          type: 'keydown',
          ctrlKey: e.ctrlKey,
          shiftKey: e.shiftKey,
          altKey: e.altKey,
          metaKey: e.metaKey,
        });
      });
      window.addEventListener('keyup', (e) => {
        this.emitter.emit('keyboard', {
          keyCode: e.keyCode,
          key: e.key,
          type: 'keyup',
          ctrlKey: e.ctrlKey,
          shiftKey: e.shiftKey,
          altKey: e.altKey,
          metaKey: e.metaKey,
        });
      });
    }

    // 小程序环境
    if (this.platform?.onShow) {
      this.platform.onShow(() => this.emitter.emit('app:show'));
    }
    if (this.platform?.onHide) {
      this.platform.onHide(() => this.emitter.emit('app:hide'));
    }
  }

  /** 触发摇一摇检测（需外部调用加速度数据） */
  detectShake(acceleration: { x: number; y: number; z: number }): void {
    const now = Date.now();
    if (now - this.lastShakeTime < this.shakeCooldown) return;

    const total = Math.sqrt(acceleration.x ** 2 + acceleration.y ** 2 + acceleration.z ** 2);
    if (total > this.shakeThreshold) {
      this.lastShakeTime = now;
      this.emitter.emit('shake', {
        acceleration,
        accelerationIncludingGravity: acceleration,
        timestamp: now,
      });
    }
  }

  /** 触发手势检测（需外部调用触摸数据） */
  detectGesture(gesture: GestureEvent): void {
    this.emitter.emit(`gesture:${gesture.type}`, gesture);
    this.emitter.emit('gesture', gesture);
  }

  /** 获取事件发射器（高级用法） */
  getEmitter(): EventEmitter {
    return this.emitter;
  }
}

// ========== 预设事件配置 ==========

/** 游戏常用事件映射 */
export const GAME_EVENTS = {
  // 生命周期
  APP_SHOW: 'app:show',
  APP_HIDE: 'app:hide',
  APP_PAUSE: 'app:pause',
  APP_RESUME: 'app:resume',

  // 网络
  NETWORK_CHANGE: 'network:change',
  NETWORK_OFFLINE: 'network:offline',
  NETWORK_ONLINE: 'network:online',

  // 电池
  BATTERY_CHANGE: 'battery:change',
  LOW_BATTERY: 'low:battery',

  // 屏幕
  ORIENTATION_CHANGE: 'orientation:change',

  // 手势
  TAP: 'gesture:tap',
  DOUBLE_TAP: 'gesture:double-tap',
  LONG_PRESS: 'gesture:long-press',
  SWIPE: 'gesture:swipe',
  PINCH: 'gesture:pinch',
  PAN: 'gesture:pan',
  ROTATE: 'gesture:rotate',

  // 传感器
  SHAKE: 'shake',
  DEVICE_ORIENTATION: 'device:orientation',

  // 输入
  KEYBOARD: 'keyboard',
  CLIPBOARD: 'clipboard',
} as const;
