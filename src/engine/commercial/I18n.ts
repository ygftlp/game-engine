// 多语言本地化系统：支持动态切换语言、文本翻译、数字/日期格式化。
import { Logger } from '../utils/Logger';

export type Locale = string;

const i18nLogger = Logger.forModule('I18n');

export interface LocaleData {
  [key: string]: string | LocaleData;
}

export class I18n {
  private static locales = new Map<string, LocaleData>();
  private static currentLocale = 'zh-CN';
  private static fallbackLocale = 'en';
  private static onChangeCallbacks: Array<(locale: string) => void> = [];

  /** 注册语言包 */
  static register(locale: string, data: LocaleData): void {
    I18n.locales.set(locale, data);
  }

  /** 设置当前语言 */
  static setLocale(locale: string): void {
    const oldLocale = I18n.currentLocale;
    I18n.currentLocale = locale;
    if (oldLocale !== locale) {
      I18n.onChangeCallbacks.forEach(cb => cb(locale));
    }
  }

  /** 获取当前语言 */
  static getLocale(): string {
    return I18n.currentLocale;
  }

  /** 设置回退语言 */
  static setFallback(locale: string): void {
    I18n.fallbackLocale = locale;
  }

  /** 翻译文本 */
  static t(key: string, params?: Record<string, string | number>): string {
    let text = I18n.getTranslation(key, I18n.currentLocale);
    if (text === undefined) {
      text = I18n.getTranslation(key, I18n.fallbackLocale);
    }
    if (text === undefined) {
      i18nLogger.warning('missing translation for key "%s"', key);
      return key;
    }

    // 替换参数
    if (params) {
      Object.keys(params).forEach(paramKey => {
        const escapedKey = paramKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        text = text!.replace(new RegExp(`\\{${escapedKey}\\}`, 'g'), String(params[paramKey]));
      });
    }

    return text;
  }

  /** 获取翻译文本 */
  private static getTranslation(key: string, locale: string): string | undefined {
    const data = I18n.locales.get(locale);
    if (!data) return undefined;

    const keys = key.split('.');
    let current: string | LocaleData | undefined = data;

    for (const k of keys) {
      if (current === undefined || current === null) return undefined;
      if (typeof current === 'string') return undefined;
      current = current[k];
    }

    return typeof current === 'string' ? current : undefined;
  }

  /** 检查翻译是否存在 */
  static has(key: string): boolean {
    return I18n.getTranslation(key, I18n.currentLocale) !== undefined ||
           I18n.getTranslation(key, I18n.fallbackLocale) !== undefined;
  }

  /** 监听语言切换 */
  static onChange(callback: (locale: string) => void): () => void {
    I18n.onChangeCallbacks.push(callback);
    return () => {
      const index = I18n.onChangeCallbacks.indexOf(callback);
      if (index >= 0) I18n.onChangeCallbacks.splice(index, 1);
    };
  }

  /** 格式化数字 */
  static formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
    return new Intl.NumberFormat(I18n.currentLocale, options).format(value);
  }

  /** 格式化日期 */
  static formatDate(date: Date, options?: Intl.DateTimeFormatOptions): string {
    return new Intl.DateTimeFormat(I18n.currentLocale, options).format(date);
  }

  /** 格式化货币 */
  static formatCurrency(value: number, currency: string): string {
    return new Intl.NumberFormat(I18n.currentLocale, {
      style: 'currency',
      currency
    }).format(value);
  }

  /** 获取所有已注册语言 */
  static getAvailableLocales(): string[] {
    return Array.from(I18n.locales.keys());
  }
}

// 预定义语言包示例
export const ZH_CN: LocaleData = {
  common: {
    ok: '确定',
    cancel: '取消',
    yes: '是',
    no: '否',
    loading: '加载中...',
    error: '错误',
    success: '成功',
    retry: '重试',
    back: '返回',
    confirm: '确认',
    save: '保存',
    delete: '删除',
    edit: '编辑',
    close: '关闭'
  },
  game: {
    start: '开始游戏',
    pause: '暂停',
    resume: '继续',
    restart: '重新开始',
    gameover: '游戏结束',
    score: '分数',
    level: '关卡',
    lives: '生命',
    settings: '设置',
    sound: '音效',
    music: '音乐',
    vibration: '振动'
  },
  dialog: {
    exitTitle: '退出确认',
    exitContent: '确定要退出游戏吗？',
    saveTitle: '保存确认',
    saveContent: '确定要保存游戏进度吗？',
    loadTitle: '加载确认',
    loadContent: '确定要加载游戏进度吗？'
  }
};

export const EN: LocaleData = {
  common: {
    ok: 'OK',
    cancel: 'Cancel',
    yes: 'Yes',
    no: 'No',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    retry: 'Retry',
    back: 'Back',
    confirm: 'Confirm',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    close: 'Close'
  },
  game: {
    start: 'Start Game',
    pause: 'Pause',
    resume: 'Resume',
    restart: 'Restart',
    gameover: 'Game Over',
    score: 'Score',
    level: 'Level',
    lives: 'Lives',
    settings: 'Settings',
    sound: 'Sound',
    music: 'Music',
    vibration: 'Vibration'
  },
  dialog: {
    exitTitle: 'Exit Confirmation',
    exitContent: 'Are you sure you want to exit the game?',
    saveTitle: 'Save Confirmation',
    saveContent: 'Are you sure you want to save the game progress?',
    loadTitle: 'Load Confirmation',
    loadContent: 'Are you sure you want to load the game progress?'
  }
};
