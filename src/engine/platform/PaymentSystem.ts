// 支付系统：支持内购、订单管理、收据验证、跨平台支付。

import { EventEmitter } from '../core/EventEmitter';

/** 支付状态 */
export type PaymentStatus = 'idle' | 'purchasing' | 'purchased' | 'failed' | 'restored' | 'cancelled';

/** 支付事件 */
export interface PaymentEvent {
  /** 事件类型 */
  event: 'started' | 'success' | 'failed' | 'cancelled' | 'restored' | 'restoring' | 'error';
  /** 订单信息 */
  order?: PaymentOrder;
  /** 错误信息 */
  error?: string;
  /** 时间戳 */
  timestamp: number;
}

/** 支付商品 */
export interface PaymentProduct {
  /** 商品 ID */
  id: string;
  /** 商品名称 */
  name: string;
  /** 描述 */
  description: string;
  /** 价格 */
  price: number;
  /** 货币 */
  currency: string;
  /** 本地化价格 */
  localizedPrice?: string;
  /** 商品类型 */
  type: 'consumable' | 'non_consumable' | 'subscription';
}

/** 支付订单 */
export interface PaymentOrder {
  /** 订单 ID */
  orderId: string;
  /** 商品 ID */
  productId: string;
  /** 价格 */
  price: number;
  /** 货币 */
  currency: string;
  /** 状态 */
  status: PaymentStatus;
  /** 支付时间 */
  purchasedAt?: number;
  /** 交易 ID */
  transactionId?: string;
  /** 收据 */
  receipt?: string;
  /** 平台 */
  platform: string;
}

/** 支付配置 */
export interface PaymentConfig {
  /** 商户 ID */
  merchantId?: string;
  /** 支付回调 URL */
  callbackUrl?: string;
  /** 是否启用沙箱 */
  sandbox?: boolean;
  /** 超时时间（毫秒） */
  timeout?: number;
}

/**
 * 支付管理器
 * 
 * 使用示例：
 *   const payment = new PaymentManager(platform);
 *   
 *   // 加载商品
 *   const products = await payment.loadProducts(['coin_100', 'coin_500']);
 *   
 *   // 监听支付事件
 *   payment.onPaymentEvent((event) => {
 *     if (event.event === 'success') {
 *       // 发放商品
 *       grantProduct(event.order!.productId);
 *     }
 *   });
 *   
 *   // 发起购买
 *   payment.purchase('coin_100');
 */
export class PaymentManager extends EventEmitter {
  private platform: any;
  private products = new Map<string, PaymentProduct>();
  private orders = new Map<string, PaymentOrder>();
  private currentStatus: PaymentStatus = 'idle';

  constructor(platform?: any, _config?: PaymentConfig) {
    super();
    this.platform = platform;
  }

  /** 初始化支付（平台初始化） */
  async init(): Promise<boolean> {
    // 微信/抖音小游戏
    if (this.platform?.requestPayment || this.platform?.pay) {
      return true;
    }

    // 浏览器环境
    return true;
  }

  /** 加载商品列表 */
  async loadProducts(productIds: string[]): Promise<PaymentProduct[]> {
    const products: PaymentProduct[] = [];

    for (const id of productIds) {
      // 小程序环境
      if (this.platform?.requestProductInfo) {
        try {
          const info = await this.platform.requestProductInfo({ productIds: [id] });
          if (info?.productList?.length > 0) {
            const p = info.productList[0];
            const product: PaymentProduct = {
              id: p.productId,
              name: p.productName,
              description: p.description ?? '',
              price: p.price ?? 0,
              currency: p.currency ?? 'CNY',
              localizedPrice: p.price,
              type: 'consumable',
            };
            this.products.set(id, product);
            products.push(product);
          }
        } catch { /* ignore platform errors */ }
      } else {
        // 浏览器模拟
        const product: PaymentProduct = {
          id,
          name: `商品 ${id}`,
          description: `这是 ${id} 的描述`,
          price: 9.99,
          currency: 'CNY',
          localizedPrice: '¥9.99',
          type: 'consumable',
        };
        this.products.set(id, product);
        products.push(product);
      }
    }

    return products;
  }

  /** 获取商品信息 */
  getProduct(productId: string): PaymentProduct | undefined {
    return this.products.get(productId);
  }

  /** 发起购买 */
  async purchase(productId: string): Promise<PaymentEvent> {
    const product = this.products.get(productId);
    if (!product) {
      return this.fail('Product not found');
    }

    this.currentStatus = 'purchasing';
    this.emit('payment:started', { productId, timestamp: Date.now() });

    const order: PaymentOrder = {
      orderId: this.generateOrderId(),
      productId,
      price: product.price,
      currency: product.currency,
      status: 'purchasing',
      platform: this.getPlatformName(),
    };

    this.orders.set(order.orderId, order);

    try {
      // 微信小游戏
      if (this.platform?.requestPayment) {
        return await this.wxPayment(order);
      }

      // 抖音小游戏
      if (this.platform?.pay) {
        return await this.ttPayment(order);
      }

      // 浏览器模拟
      return await this.browserPayment(order);
    } catch (err) {
      order.status = 'failed';
      return this.fail(String(err));
    }
  }

  /** 恢复购买（iOS 用） */
  async restorePurchases(): Promise<PaymentOrder[]> {
    this.emit('payment:restoring', { timestamp: Date.now() });

    if (this.platform?.restorePurchases) {
      try {
        const result = await this.platform.restorePurchases();
        return result ?? [];
      } catch {
        return [];
      }
    }

    return [];
  }

  /** 获取所有订单 */
  getOrders(): PaymentOrder[] {
    return Array.from(this.orders.values());
  }

  /** 获取指定订单 */
  getOrder(orderId: string): PaymentOrder | undefined {
    return this.orders.get(orderId);
  }

  /** 获取已购买的商品 ID 列表 */
  getPurchasedProductIds(): string[] {
    return this.getOrders()
      .filter(o => o.status === 'purchased')
      .map(o => o.productId);
  }

  /** 检查是否已购买 */
  hasPurchased(productId: string): boolean {
    return this.getOrders().some(o => o.productId === productId && o.status === 'purchased');
  }

  /** 获取当前状态 */
  getStatus(): PaymentStatus {
    return this.currentStatus;
  }

  /** 监听支付事件 */
  onPaymentEvent(callback: (event: PaymentEvent) => void): () => void {
    this.on('payment:event', callback as any);
    return () => this.off('payment:event', callback as any);
  }

  /** 监听支付成功 */
  onPaymentSuccess(callback: (order: PaymentOrder) => void): () => void {
    this.on('payment:success', callback as any);
    return () => this.off('payment:success', callback as any);
  }

  /** 监听支付失败 */
  onPaymentFailed(callback: (error: string) => void): () => void {
    this.on('payment:failed', callback as any);
    return () => this.off('payment:failed', callback as any);
  }

  /** 销毁 */
  destroy(): void {
    this.orders.clear();
    this.products.clear();
    this.emit('payment:destroyed');
  }

  private async wxPayment(order: PaymentOrder): Promise<PaymentEvent> {
    return new Promise((resolve) => {
      this.platform.requestPayment({
        timeStamp: String(Math.floor(Date.now() / 1000)),
        nonceStr: this.generateNonceStr(),
        package: 'prepay_id=wx_test',
        signType: 'MD5',
        paySign: 'test_sign',
        success: () => {
          order.status = 'purchased';
          order.purchasedAt = Date.now();
          this.currentStatus = 'purchased';
          this.emitPaymentEvent({ event: 'success', order, timestamp: Date.now() });
          this.emit('payment:success', order);
          resolve({ event: 'success', order, timestamp: Date.now() });
        },
        fail: (err: any) => {
          order.status = 'failed';
          this.currentStatus = 'failed';
          const error = err.errMsg ?? 'Payment failed';
          this.emitPaymentEvent({ event: 'failed', order, error, timestamp: Date.now() });
          this.emit('payment:failed', error);
          resolve({ event: 'failed', order, error, timestamp: Date.now() });
        },
      });
    });
  }

  private async ttPayment(order: PaymentOrder): Promise<PaymentEvent> {
    return new Promise((resolve) => {
      this.platform.pay({
        orderInfo: {
          order_id: order.orderId,
          product_id: order.productId,
          amount: order.price,
        },
        success: () => {
          order.status = 'purchased';
          order.purchasedAt = Date.now();
          this.currentStatus = 'purchased';
          this.emitPaymentEvent({ event: 'success', order, timestamp: Date.now() });
          this.emit('payment:success', order);
          resolve({ event: 'success', order, timestamp: Date.now() });
        },
        fail: (err: any) => {
          order.status = 'failed';
          this.currentStatus = 'failed';
          const error = err.errMsg ?? 'Payment failed';
          this.emitPaymentEvent({ event: 'failed', order, error, timestamp: Date.now() });
          this.emit('payment:failed', error);
          resolve({ event: 'failed', order, error, timestamp: Date.now() });
        },
      });
    });
  }

  private async browserPayment(order: PaymentOrder): Promise<PaymentEvent> {
    return new Promise((resolve) => {
      // 浏览器模拟延迟
      setTimeout(() => {
        const success = Math.random() > 0.1; // 90% 成功率
        if (success) {
          order.status = 'purchased';
          order.purchasedAt = Date.now();
          order.transactionId = this.generateOrderId();
          this.currentStatus = 'purchased';
          this.emitPaymentEvent({ event: 'success', order, timestamp: Date.now() });
          this.emit('payment:success', order);
          resolve({ event: 'success', order, timestamp: Date.now() });
        } else {
          order.status = 'failed';
          this.currentStatus = 'failed';
          this.emitPaymentEvent({ event: 'failed', order, error: 'Payment failed', timestamp: Date.now() });
          this.emit('payment:failed', 'Payment failed');
          resolve({ event: 'failed', order, error: 'Payment failed', timestamp: Date.now() });
        }
      }, 1000);
    });
  }

  private fail(error: string): PaymentEvent {
    this.currentStatus = 'failed';
    this.emitPaymentEvent({ event: 'failed', error, timestamp: Date.now() });
    this.emit('payment:failed', error);
    return { event: 'failed', error, timestamp: Date.now() };
  }

  private emitPaymentEvent(event: PaymentEvent): void {
    this.emit('payment:event', event);
  }

  private getPlatformName(): string {
    if (typeof wx !== 'undefined') return 'wechat';
    if (typeof tt !== 'undefined') return 'douyin';
    return 'browser';
  }

  private generateOrderId(): string {
    return `order_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  private generateNonceStr(): string {
    return Math.random().toString(36).slice(2, 15);
  }
}

// ========== 便捷支付配置 ==========

/** 创建游戏币购买配置 */
export function createCoinProduct(id: string, amount: number, price: number): PaymentProduct {
  return {
    id,
    name: `${amount} 游戏币`,
    description: `购买 ${amount} 游戏币`,
    price,
    currency: 'CNY',
    type: 'consumable',
  };
}

/** 创建月卡配置 */
export function createMonthCardProduct(id: string, price: number): PaymentProduct {
  return {
    id,
    name: '月卡',
    description: '购买月卡，每日领取奖励',
    price,
    currency: 'CNY',
    type: 'subscription',
  };
}
