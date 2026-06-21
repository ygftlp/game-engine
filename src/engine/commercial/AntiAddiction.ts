// 未成年人保护功能模块：防沉迷系统、实名认证、游戏时长限制。
import { Logger } from '../utils/Logger';

export interface UserInfo {
  userId: string;
  age: number;
  isMinor: boolean;
  isRealNameVerified: boolean;
}

export interface PlayTimeInfo {
  todayPlayTime: number;  // 今日游戏时长（秒）
  weekPlayTime: number;   // 本周游戏时长（秒）
  lastPlayDate: string;   // 最后游戏日期
  isHoliday: boolean;     // 是否节假日
}

export type AntiAddictionCallback = (event: AntiAddictionEvent) => void;

export interface AntiAddictionEvent {
  type: 'time_limit' | 'force_logout' | 'play_time_warning' | 'curfew_warning';
  message: string;
  remainingTime?: number;
}

/** 防沉迷配置 */
export interface AntiAddictionConfig {
  /** 未成年人每日游戏时长限制（秒） */
  minorDailyLimit: number;
  /** 未成年人每周游戏时长限制（秒） */
  minorWeeklyLimit: number;
  /** 未成年人宵禁开始时间（小时，24小时制） */
  curfewStartHour: number;
  /** 未成年人宵禁结束时间（小时，24小时制） */
  curfewEndHour: number;
  /** 时长警告阈值（秒） */
  warningThreshold: number;
  /** 节假日每日时长限制（秒） */
  holidayDailyLimit: number;
}

/** 默认防沉迷配置（符合中国法规） */
const DEFAULT_CONFIG: AntiAddictionConfig = {
  minorDailyLimit: 90 * 60,      // 90分钟
  minorWeeklyLimit: 3 * 60 * 60,  // 3小时
  curfewStartHour: 22,
  curfewEndHour: 8,
  warningThreshold: 10 * 60,      // 10分钟警告
  holidayDailyLimit: 3 * 60 * 60  // 节假日3小时
};

const antiAddictionLogger = Logger.forModule('AntiAddiction');

export class AntiAddictionSystem {
  private config: AntiAddictionConfig;
  private userInfo: UserInfo | null = null;
  private playTime: PlayTimeInfo;
  private callback: AntiAddictionCallback | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private sessionStartTime = 0;
  private isPaused = false;

  constructor(config?: Partial<AntiAddictionConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.playTime = this.loadPlayTime();
  }

  /** 初始化用户信息 */
  init(userInfo: UserInfo, callback: AntiAddictionCallback): void {
    this.userInfo = userInfo;
    this.callback = callback;

    // 检查宵禁
    if (this.isMinor() && this.isCurfewTime()) {
      this.notify({
        type: 'curfew_warning',
        message: '当前为宵禁时间，未成年人无法进行游戏'
      });
      return;
    }

    // 检查今日时长
    if (this.isMinor() && this.isDailyLimitReached()) {
      this.notify({
        type: 'time_limit',
        message: '今日游戏时长已用完，请明天再来'
      });
      return;
    }

    // 开始计时
    this.startTimer();
  }

  /** 开始游戏会话 */
  startSession(): void {
    this.sessionStartTime = Date.now();
    this.isPaused = false;
  }

  /** 暂停游戏（切后台等） */
  pause(): void {
    if (this.isPaused) return;
    this.isPaused = true;
    
    const elapsed = Math.floor((Date.now() - this.sessionStartTime) / 1000);
    this.playTime.todayPlayTime += elapsed;
    this.playTime.weekPlayTime += elapsed;
    this.savePlayTime();
  }

  /** 恢复游戏 */
  resume(): void {
    if (!this.isPaused) return;
    this.isPaused = false;
    this.sessionStartTime = Date.now();
  }

  /** 结束游戏会话 */
  endSession(): void {
    if (this.sessionStartTime === 0) return;
    
    const elapsed = Math.floor((Date.now() - this.sessionStartTime) / 1000);
    this.playTime.todayPlayTime += elapsed;
    this.playTime.weekPlayTime += elapsed;
    this.sessionStartTime = 0;
    this.savePlayTime();
  }

  /** 检查是否未成年 */
  isMinor(): boolean {
    return this.userInfo?.isMinor ?? false;
  }

  /** 检查是否实名认证 */
  isRealNameVerified(): boolean {
    return this.userInfo?.isRealNameVerified ?? false;
  }

  /** 获取今日已玩时长（秒） */
  getTodayPlayTime(): number {
    let totalTime = this.playTime.todayPlayTime;
    if (this.sessionStartTime > 0 && !this.isPaused) {
      totalTime += Math.floor((Date.now() - this.sessionStartTime) / 1000);
    }
    return totalTime;
  }

  /** 获取今日剩余时长（秒） */
  getRemainingTime(): number {
    if (!this.isMinor()) return Infinity;
    
    const limit = this.playTime.isHoliday ? 
      this.config.holidayDailyLimit : 
      this.config.minorDailyLimit;
    
    return Math.max(0, limit - this.getTodayPlayTime());
  }

  /** 检查是否达到每日限制 */
  isDailyLimitReached(): boolean {
    return this.getRemainingTime() <= 0;
  }

  /** 检查是否在宵禁时间 */
  isCurfewTime(): boolean {
    const hour = new Date().getHours();
    return hour >= this.config.curfewStartHour || hour < this.config.curfewEndHour;
  }

  /** 开始计时器 */
  private startTimer(): void {
    this.timer = setInterval(() => {
      if (this.isPaused || !this.isMinor()) return;

      const remaining = this.getRemainingTime();

      // 时长警告
      if (remaining <= this.config.warningThreshold && remaining > 0) {
        this.notify({
          type: 'play_time_warning',
          message: `游戏时长即将用完，剩余${Math.ceil(remaining / 60)}分钟`,
          remainingTime: remaining
        });
      }

      // 时长用完
      if (remaining <= 0) {
        this.notify({
          type: 'time_limit',
          message: '今日游戏时长已用完，请明天再来'
        });
        this.stopTimer();
      }

      // 宵禁检查
      if (this.isCurfewTime()) {
        this.notify({
          type: 'curfew_warning',
          message: '当前为宵禁时间，请注意休息'
        });
        this.stopTimer();
      }
    }, 1000);
  }

  /** 停止计时器 */
  private stopTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /** 发送通知 */
  private notify(event: AntiAddictionEvent): void {
    if (this.callback) {
      this.callback(event);
    }
  }

  /** 加载游戏时长数据 */
  private loadPlayTime(): PlayTimeInfo {
    try {
      const saved = localStorage.getItem('playTime');
      if (saved) {
        const data = JSON.parse(saved);
        // 检查是否是今天
        const today = new Date().toISOString().split('T')[0];
        if (data.lastPlayDate !== today) {
          // 新的一天，重置今日时长
          data.todayPlayTime = 0;
          data.lastPlayDate = today;
        }
        // 检查是否是新的一周（周一）
        const lastDate = new Date(data.lastPlayDate);
        const now = new Date();
        const lastWeek = Math.floor(lastDate.getTime() / (7 * 24 * 60 * 60 * 1000));
        const currentWeek = Math.floor(now.getTime() / (7 * 24 * 60 * 60 * 1000));
        if (lastWeek < currentWeek) {
          data.weekPlayTime = 0;
        }
        return data;
      }
    } catch (e) {
      antiAddictionLogger.warning('failed to load play time error=%o', e);
    }

    return {
      todayPlayTime: 0,
      weekPlayTime: 0,
      lastPlayDate: new Date().toISOString().split('T')[0],
      isHoliday: false
    };
  }

  /** 保存游戏时长数据 */
  private savePlayTime(): void {
    try {
      this.playTime.lastPlayDate = new Date().toISOString().split('T')[0];
      localStorage.setItem('playTime', JSON.stringify(this.playTime));
    } catch (e) {
      antiAddictionLogger.warning('failed to save play time error=%o', e);
    }
  }

  /** 设置节假日 */
  setHoliday(isHoliday: boolean): void {
    this.playTime.isHoliday = isHoliday;
  }

  /** 销毁系统 */
  destroy(): void {
    this.endSession();
    this.stopTimer();
  }
}

/** 实名认证接口 */
export interface RealNameAuthProvider {
  /** 发起实名认证 */
  authenticate(callback: (result: RealNameResult) => void): void;
  /** 查询认证状态 */
  checkStatus(callback: (result: RealNameResult) => void): void;
}

export interface RealNameResult {
  success: boolean;
  userId?: string;
  age?: number;
  isMinor?: boolean;
  error?: string;
}

/** 微信实名认证 */
export class WxRealNameAuth implements RealNameAuthProvider {
  authenticate(callback: (result: RealNameResult) => void): void {
    if (typeof wx === 'undefined') {
      callback({ success: false, error: 'wx is not defined' });
      return;
    }

    // 微信小游戏实名认证
    wx.realnameAuthentication({
      success: (res: WxAuthSuccessResult) => {
        callback({
          success: true,
          userId: res.userId,
          age: res.age,
          isMinor: res.age < 18
        });
      },
      fail: (err: WxAuthError) => {
        callback({ success: false, error: err.message });
      }
    });
  }

  checkStatus(callback: (result: RealNameResult) => void): void {
    if (typeof wx === 'undefined') {
      callback({ success: false, error: 'wx is not defined' });
      return;
    }

    wx.checkRealNameAuthentication({
      success: (res: WxAuthCheckSuccessResult) => {
        callback({
          success: res.isAuthed,
          userId: res.userId,
          age: res.age,
          isMinor: res.age < 18
        });
      },
      fail: (err: WxAuthError) => {
        callback({ success: false, error: err.message });
      }
    });
  }
}
