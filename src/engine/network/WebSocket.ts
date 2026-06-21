// WebSocket 客户端：支持全双工通信、断线重连、心跳保活、消息序列化
import { EventEmitter } from '../core/EventEmitter';
import { Logger } from '../utils/Logger';

const wsLogger = Logger.forModule('WebSocket');

/** WebSocket 配置 */
export interface WebSocketConfig {
  /** 服务器地址 */
  url: string;
  /** 协议 */
  protocols?: string | string[];
  /** 是否自动重连 */
  autoReconnect?: boolean;
  /** 最大重连次数 */
  maxReconnectAttempts?: number;
  /** 重连间隔（毫秒） */
  reconnectInterval?: number;
  /** 心跳间隔（毫秒） */
  heartbeatInterval?: number;
  /** 心跳消息 */
  heartbeatMessage?: string | (() => string);
  /** 连接超时（毫秒） */
  connectTimeout?: number;
  /** 消息序列化器 */
  serializer?: MessageSerializer;
}

/** 消息序列化器 */
export interface MessageSerializer {
  serialize(data: any): string | ArrayBuffer;
  deserialize(data: string | ArrayBuffer): any;
}

/** 默认JSON序列化器 */
export class JsonSerializer implements MessageSerializer {
  serialize(data: any): string {
    return JSON.stringify(data);
  }

  deserialize(data: string | ArrayBuffer): any {
    if (typeof data === 'string') {
      return JSON.parse(data);
    }
    // ArrayBuffer转字符串后解析
    const decoder = new TextDecoder();
    return JSON.parse(decoder.decode(data));
  }
}

/** WebSocket 连接状态 */
export enum WebSocketState {
  Connecting = 'connecting',
  Open = 'open',
  Closing = 'closing',
  Closed = 'closed',
  Reconnecting = 'reconnecting',
}

/** WebSocket 消息 */
export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
}

/**
 * WebSocket 客户端
 */
export class WebSocketClient extends EventEmitter {
  private config: Required<WebSocketConfig>;
  private ws: WebSocket | null = null;
  private state: WebSocketState = WebSocketState.Closed;
  private reconnectAttempts = 0;
  private reconnectTimer: any = null;
  private heartbeatTimer: any = null;
  private connectTimer: any = null;
  private messageQueue: Array<string | ArrayBuffer> = [];
  private lastHeartbeat = 0;
  private pendingResolve: (() => void) | null = null;

  constructor(config: WebSocketConfig) {
    super();
    this.config = {
      url: config.url,
      protocols: config.protocols ?? [],
      autoReconnect: config.autoReconnect ?? true,
      maxReconnectAttempts: config.maxReconnectAttempts ?? 10,
      reconnectInterval: config.reconnectInterval ?? 3000,
      heartbeatInterval: config.heartbeatInterval ?? 30000,
      heartbeatMessage: config.heartbeatMessage ?? 'ping',
      connectTimeout: config.connectTimeout ?? 10000,
      serializer: config.serializer ?? new JsonSerializer(),
    };
  }

  /**
   * 连接WebSocket
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.state === WebSocketState.Open) {
        resolve();
        return;
      }

      this.state = WebSocketState.Connecting;
      this.emit('connecting');
      this.pendingResolve = resolve;

      // 连接超时
      this.connectTimer = setTimeout(() => {
        this.emit('error', new Error('Connection timeout'));
        this.close();
        reject(new Error('Connection timeout'));
      }, this.config.connectTimeout);

      try {
        const ws = typeof wx !== 'undefined'
          ? this.createWxSocket()
          : typeof tt !== 'undefined'
            ? this.createTtSocket()
            : new WebSocket(this.config.url, this.config.protocols as string[]);

        this.ws = ws;

        if (ws instanceof WebSocket) {
          // 浏览器WebSocket
          ws.onopen = () => this.handleOpen();
          ws.onmessage = (e) => this.handleMessage(e.data);
          ws.onclose = (e) => this.handleClose(e.code, e.reason);
          ws.onerror = (e) => this.handleError(e);
        }
      } catch (err) {
        this.state = WebSocketState.Closed;
        this.emit('error', err);
        reject(err);
      }
    });
  }

  /**
   * 创建微信小程序WebSocket
   */
  private createWxSocket(): any {
    const socket = wx.connectSocket({
      url: this.config.url,
      protocols: this.config.protocols as string[],
    });

    socket.onOpen(() => this.handleOpen());
    socket.onMessage((res: any) => this.handleMessage(res.data));
    socket.onClose((res: any) => this.handleClose(res.code, res.reason));
    socket.onError((err: any) => this.handleError(err));

    return socket;
  }

  /**
   * 创建抖音小程序WebSocket
   */
  private createTtSocket(): any {
    const socket = tt.connectSocket({
      url: this.config.url,
      protocols: this.config.protocols as string[],
    });

    socket.onOpen(() => this.handleOpen());
    socket.onMessage((res: any) => this.handleMessage(res.data));
    socket.onClose((res: any) => this.handleClose(res.code, res.reason));
    socket.onError((err: any) => this.handleError(err));

    return socket;
  }

  /**
   * 处理连接打开
   */
  private handleOpen(): void {
    clearTimeout(this.connectTimer);
    this.state = WebSocketState.Open;
    this.reconnectAttempts = 0;
    this.emit('open');

    // 启动心跳
    this.startHeartbeat();

    // 发送队列中的消息
    this.flushQueue();

    // 解析连接Promise
    this.pendingResolve?.();
    this.pendingResolve = null;
  }

  /**
   * 处理消息接收
   */
  private handleMessage(data: string | ArrayBuffer): void {
    try {
      const message = this.config.serializer.deserialize(data);
      this.emit('message', message);

      // 心跳响应
      if (data === 'pong' || (typeof data === 'string' && data.includes('"type":"pong"'))) {
        this.lastHeartbeat = Date.now();
        this.emit('heartbeat');
      }
    } catch (err) {
      this.emit('error', err);
    }
  }

  /**
   * 处理连接关闭
   */
  private handleClose(code: number, reason: string): void {
    this.stopHeartbeat();
    this.state = WebSocketState.Closed;
    this.emit('close', { code, reason });

    // 自动重连
    if (this.config.autoReconnect && this.reconnectAttempts < this.config.maxReconnectAttempts) {
      this.scheduleReconnect();
    }
  }

  /**
   * 处理错误
   */
  private handleError(error: any): void {
    wsLogger.error('WebSocket error:', error);
    this.emit('error', error);
  }

  /**
   * 发送消息
   */
  send(data: any): void {
    const serialized = this.config.serializer.serialize(data);

    if (this.state === WebSocketState.Open) {
      this.doSend(serialized);
    } else {
      // 加入队列
      this.messageQueue.push(serialized);
    }
  }

  /**
   * 发送原始数据
   */
  sendRaw(data: string | ArrayBuffer): void {
    if (this.state === WebSocketState.Open) {
      this.doSend(data);
    } else {
      this.messageQueue.push(data);
    }
  }

  /**
   * 实际发送
   */
  private doSend(data: string | ArrayBuffer): void {
    try {
      if (this.ws instanceof WebSocket) {
        this.ws.send(data);
      } else if (this.ws && 'send' in this.ws) {
        (this.ws as any).send({ data });
      }
      this.emit('send', data);
    } catch (err) {
      this.emit('error', err);
    }
  }

  /**
   * 发送队列中的消息
   */
  private flushQueue(): void {
    while (this.messageQueue.length > 0) {
      const data = this.messageQueue.shift()!;
      this.doSend(data);
    }
  }

  /**
   * 关闭连接
   */
  close(code = 1000, reason = 'Normal closure'): void {
    this.stopHeartbeat();
    clearTimeout(this.connectTimer);
    clearTimeout(this.reconnectTimer);

    if (this.ws) {
      this.state = WebSocketState.Closing;
      if (this.ws instanceof WebSocket) {
        this.ws.close(code, reason);
      } else if ('close' in this.ws) {
        (this.ws as any).close();
      }
    } else {
      this.state = WebSocketState.Closed;
    }
  }

  /**
   * 启动心跳
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.lastHeartbeat = Date.now();

    this.heartbeatTimer = setInterval(() => {
      if (this.state === WebSocketState.Open) {
        const message = typeof this.config.heartbeatMessage === 'function'
          ? this.config.heartbeatMessage()
          : this.config.heartbeatMessage;
        this.send(message);
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * 停止心跳
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * 计划重连
   */
  private scheduleReconnect(): void {
    this.state = WebSocketState.Reconnecting;
    this.reconnectAttempts++;
    this.emit('reconnecting', this.reconnectAttempts);

    const delay = this.config.reconnectInterval * Math.pow(1.5, this.reconnectAttempts - 1);
    wsLogger.info(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(() => {
        // 重连失败，继续尝试
      });
    }, delay);
  }

  /**
   * 获取连接状态
   */
  getState(): WebSocketState {
    return this.state;
  }

  /**
   * 是否已连接
   */
  isConnected(): boolean {
    return this.state === WebSocketState.Open;
  }

  /**
   * 获取重连次数
   */
  getReconnectAttempts(): number {
    return this.reconnectAttempts;
  }

  /**
   * 获取最后心跳时间
   */
  getLastHeartbeat(): number {
    return this.lastHeartbeat;
  }
}

/**
 * 创建WebSocket客户端
 */
export function createWebSocket(config: WebSocketConfig): WebSocketClient {
  return new WebSocketClient(config);
}