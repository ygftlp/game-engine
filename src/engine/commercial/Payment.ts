// 支付接入接口：统一封装微信、抖音、H5支付能力。
import { Logger } from '../utils/Logger';

export interface PaymentProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  icon?: string;
}

export interface PaymentOrder {
  orderId: string;
  productId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'success' | 'failed' | 'cancelled';
  platform: string;
  timestamp: number;
  extra?: Record<string, unknown>;
}

export type PaymentCallback = (order: PaymentOrder) => void;

export abstract class PaymentAdapter {
  abstract pay(product: PaymentProduct, callback: PaymentCallback): void;
  abstract restore(callback: PaymentCallback): void;
  abstract getProducts(): Promise<PaymentProduct[]>;
}

const paymentLogger = Logger.forModule('Payment');

/** 微信支付适配器 */
export class WxPaymentAdapter extends PaymentAdapter {
  pay(product: PaymentProduct, callback: PaymentCallback): void {
    if (typeof wx === 'undefined') {
      paymentLogger.error('WxPaymentAdapter: wx is not defined');
      return;
    }

    wx.requestMidasPayment({
      mode: 'game',
      env: 0, // 0: 正式环境, 1: 沙箱环境
      offerId: product.id,
      currencyType: 'CNY',
      buyQuantity: 1,
      zoneId: '1',
      platform: 'android',
      success: () => {
        callback({
          orderId: Date.now().toString(),
          productId: product.id,
          amount: product.price,
          currency: product.currency,
          status: 'success',
          platform: 'wechat',
          timestamp: Date.now()
        });
      },
      fail: (err: unknown) => {
        paymentLogger.error('WxPaymentAdapter: payment failed error=%o', err);
        callback({
          orderId: Date.now().toString(),
          productId: product.id,
          amount: product.price,
          currency: product.currency,
          status: 'failed',
          platform: 'wechat',
          timestamp: Date.now(),
          extra: { error: err }
        });
      }
    });
  }

  restore(_callback: PaymentCallback): void {
    // 微信小游戏无需恢复购买
    paymentLogger.info('WxPaymentAdapter: restore not supported');
  }

  async getProducts(): Promise<PaymentProduct[]> {
    // 需要从服务器获取商品列表
    return [];
  }
}

/** 抖音支付适配器 */
export class TtPaymentAdapter extends PaymentAdapter {
  pay(product: PaymentProduct, callback: PaymentCallback): void {
    if (typeof tt === 'undefined') {
      paymentLogger.error('TtPaymentAdapter: tt is not defined');
      return;
    }

    tt.requestGamePayment({
      mode: 'game',
      env: 0,
      offerId: product.id,
      currencyType: 'CNY',
      buyQuantity: 1,
      zoneId: '1',
      platform: 'android',
      success: () => {
        callback({
          orderId: Date.now().toString(),
          productId: product.id,
          amount: product.price,
          currency: product.currency,
          status: 'success',
          platform: 'douyin',
          timestamp: Date.now()
        });
      },
      fail: (err: unknown) => {
        paymentLogger.error('TtPaymentAdapter: payment failed error=%o', err);
        callback({
          orderId: Date.now().toString(),
          productId: product.id,
          amount: product.price,
          currency: product.currency,
          status: 'failed',
          platform: 'douyin',
          timestamp: Date.now(),
          extra: { error: err }
        });
      }
    });
  }

  restore(_callback: PaymentCallback): void {
    paymentLogger.info('TtPaymentAdapter: restore not supported');
  }

  async getProducts(): Promise<PaymentProduct[]> {
    return [];
  }
}

/** H5支付适配器（示例：支付宝/微信H5支付） */
export class H5PaymentAdapter extends PaymentAdapter {
  private apiEndpoint: string;

  constructor(apiEndpoint: string) {
    super();
    this.apiEndpoint = apiEndpoint;
  }

  async pay(product: PaymentProduct, callback: PaymentCallback): Promise<void> {
    try {
      // 1. 从服务器创建订单
      const response = await fetch(`${this.apiEndpoint}/create_order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          amount: product.price,
          currency: product.currency
        })
      });

      const orderData = await response.json() as { paymentUrl: string; orderId: string };

      // 2. 跳转到支付页面
      window.location.href = orderData.paymentUrl;

      // 3. 轮询订单状态（实际应该用WebSocket或回调）
      const checkStatus = async () => {
        const statusResponse = await fetch(`${this.apiEndpoint}/order_status/${orderData.orderId}`);
        const statusData = await statusResponse.json() as { status: PaymentOrder['status'] };
        
        callback({
          orderId: orderData.orderId,
          productId: product.id,
          amount: product.price,
          currency: product.currency,
          status: statusData.status,
          platform: 'h5',
          timestamp: Date.now()
        });
      };

      // 延迟检查
      setTimeout(checkStatus, 3000);
    } catch (err) {
      paymentLogger.error('H5PaymentAdapter: payment failed error=%o', err);
      callback({
        orderId: Date.now().toString(),
        productId: product.id,
        amount: product.price,
        currency: product.currency,
        status: 'failed',
        platform: 'h5',
        timestamp: Date.now(),
        extra: { error: err }
      });
    }
  }

  restore(_callback: PaymentCallback): void {
    paymentLogger.info('H5PaymentAdapter: restore not implemented');
  }

  async getProducts(): Promise<PaymentProduct[]> {
    try {
      const response = await fetch(`${this.apiEndpoint}/products`);
      return await response.json();
    } catch (err) {
      paymentLogger.error('H5PaymentAdapter: getProducts failed error=%o', err);
      return [];
    }
  }
}

/** 支付管理器 */
export class PaymentManager {
  private adapter: PaymentAdapter;
  private products: PaymentProduct[] = [];

  constructor(adapter: PaymentAdapter) {
    this.adapter = adapter;
  }

  /** 初始化商品列表 */
  async init(): Promise<void> {
    this.products = await this.adapter.getProducts();
  }

  /** 获取商品列表 */
  getProducts(): PaymentProduct[] {
    return [...this.products];
  }

  /** 获取商品 */
  getProduct(id: string): PaymentProduct | undefined {
    return this.products.find(p => p.id === id);
  }

  /** 发起支付 */
  pay(productId: string, callback: PaymentCallback): void {
    const product = this.getProduct(productId);
    if (!product) {
      paymentLogger.error('PaymentManager: product "%s" not found', productId);
      return;
    }
    this.adapter.pay(product, callback);
  }

  /** 恢复购买 */
  restore(callback: PaymentCallback): void {
    this.adapter.restore(callback);
  }
}
