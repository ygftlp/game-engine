// 商用功能模块：提供支付、统计、防沉迷等商业化必备能力。
export { I18n, ZH_CN, EN } from './I18n';
export type { Locale, LocaleData } from './I18n';

export { PaymentManager, WxPaymentAdapter, TtPaymentAdapter, H5PaymentAdapter } from './Payment';
export type { PaymentProduct, PaymentOrder, PaymentCallback, PaymentAdapter } from './Payment';

export { AnalyticsManager, WxAnalyticsAdapter, TtAnalyticsAdapter, H5AnalyticsAdapter } from './Analytics';
export type { AnalyticsEvent, UserProperties, AnalyticsAdapter } from './Analytics';

export { AntiAddictionSystem, WxRealNameAuth } from './AntiAddiction';
export type { 
  UserInfo, PlayTimeInfo, AntiAddictionConfig, 
  AntiAddictionEvent, RealNameAuthProvider, RealNameResult 
} from './AntiAddiction';