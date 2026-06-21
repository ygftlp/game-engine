// HTTP 请求工具集：支持GET/POST、超时、重试、拦截器
import { Logger } from '../utils/Logger';

const httpLogger = Logger.forModule('HTTP');

/** 请求配置 */
export interface RequestConfig {
  /** 请求URL */
  url: string;
  /** 请求方法 */
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  /** 请求头 */
  headers?: Record<string, string>;
  /** 请求体 */
  body?: any;
  /** 查询参数 */
  params?: Record<string, string | number>;
  /** 超时时间（毫秒） */
  timeout?: number;
  /** 重试次数 */
  retries?: number;
  /** 重试延迟（毫秒） */
  retryDelay?: number;
  /** 响应类型 */
  responseType?: 'json' | 'text' | 'arraybuffer' | 'blob';
  /** 是否携带凭证 */
  withCredentials?: boolean;
  /** 请求前拦截器 */
  onRequest?: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
  /** 响应后拦截器 */
  onResponse?: (response: Response) => Response | Promise<Response>;
  /** 错误拦截器 */
  onError?: (error: HttpError) => void;
}

/** 响应 */
export interface Response<T = any> {
  /** 响应数据 */
  data: T;
  /** 状态码 */
  status: number;
  /** 状态文本 */
  statusText: string;
  /** 响应头 */
  headers: Record<string, string>;
  /** 请求配置 */
  config: RequestConfig;
}

/** HTTP错误 */
export class HttpError extends Error {
  constructor(
    message: string,
    public status?: number,
    public config?: RequestConfig,
    public response?: Response
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

/** 默认配置 */
const DEFAULT_CONFIG: Partial<RequestConfig> = {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
  retries: 0,
  retryDelay: 1000,
  responseType: 'json',
};

/**
 * HTTP 客户端
 */
export class HttpClient {
  private config: Partial<RequestConfig>;
  private interceptors: {
    request: Array<(config: RequestConfig) => RequestConfig | Promise<RequestConfig>>;
    response: Array<(response: Response) => Response | Promise<Response>>;
    error: Array<(error: HttpError) => void>;
  } = {
    request: [],
    response: [],
    error: [],
  };

  constructor(config?: Partial<RequestConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 添加请求拦截器
   */
  addRequestInterceptor(interceptor: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>): void {
    this.interceptors.request.push(interceptor);
  }

  /**
   * 添加响应拦截器
   */
  addResponseInterceptor(interceptor: (response: Response) => Response | Promise<Response>): void {
    this.interceptors.response.push(interceptor);
  }

  /**
   * 添加错误拦截器
   */
  addErrorInterceptor(interceptor: (error: HttpError) => void): void {
    this.interceptors.error.push(interceptor);
  }

  /**
   * 发送请求
   */
  async request<T = any>(config: RequestConfig): Promise<Response<T>> {
    // 合并配置
    let mergedConfig: RequestConfig = {
      ...this.config,
      ...config,
      headers: {
        ...this.config.headers,
        ...config.headers,
      },
    };

    // 应用请求拦截器
    for (const interceptor of this.interceptors.request) {
      mergedConfig = await interceptor(mergedConfig);
    }

    // 处理查询参数
    if (mergedConfig.params) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(mergedConfig.params)) {
        searchParams.append(key, String(value));
      }
      const separator = mergedConfig.url.includes('?') ? '&' : '?';
      mergedConfig.url = `${mergedConfig.url}${separator}${searchParams.toString()}`;
    }

    // 重试逻辑
    let lastError: HttpError | null = null;
    const maxAttempts = (mergedConfig.retries || 0) + 1;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await this.doRequest<T>(mergedConfig);

        // 应用响应拦截器
        let finalResponse = response;
        for (const interceptor of this.interceptors.response) {
          finalResponse = await interceptor(finalResponse) as Response<T>;
        }

        return finalResponse;
      } catch (error) {
        lastError = error as HttpError;
        this.interceptors.error.forEach(fn => fn(lastError!));

        // 如果还有重试次数，等待后重试（指数退避）
        if (attempt < maxAttempts - 1) {
          await this.delay(mergedConfig.retryDelay! * Math.pow(2, attempt));
          httpLogger.warn(`Request failed, retrying (${attempt + 1}/${mergedConfig.retries})...`);
        }
      }
    }

    throw lastError;
  }

  /**
   * 执行实际请求
   */
  private async doRequest<T>(config: RequestConfig): Promise<Response<T>> {
    const { url, method, headers, body, timeout, responseType } = config;

    return new Promise((resolve, reject) => {
      // 超时控制
      let timeoutId: any;
      if (timeout && timeout > 0) {
        timeoutId = setTimeout(() => {
          reject(new HttpError(`Request timeout after ${timeout}ms`, 0, config));
        }, timeout);
      }

      // 微信/抖音小程序请求
      if (typeof wx !== 'undefined' || typeof tt !== 'undefined') {
        const api = typeof wx !== 'undefined' ? wx : tt;
        api.request({
          url,
          method: method as any,
          header: headers as any,
          data: body,
          dataType: responseType === 'json' ? 'json' : 'text',
          success: (res: any) => {
            clearTimeout(timeoutId);
            const response: Response<T> = {
              data: res.data as T,
              status: res.statusCode,
              statusText: res.statusCode === 200 ? 'OK' : 'Error',
              headers: res.header || {},
              config,
            };
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(response);
            } else {
              reject(new HttpError(`Request failed with status ${res.statusCode}`, res.statusCode, config, response));
            }
          },
          fail: (err: any) => {
            clearTimeout(timeoutId);
            reject(new HttpError(err.errMsg || 'Request failed', 0, config));
          },
        });
      }
      // 浏览器fetch
      else {
        const contentType = headers?.['Content-Type'] || '';
        let serializedBody: BodyInit | undefined;
        if (body !== undefined && body !== null) {
          if (typeof body === 'string' || body instanceof ArrayBuffer || body instanceof Blob || body instanceof FormData) {
            serializedBody = body;
          } else if (contentType.includes('application/json')) {
            serializedBody = JSON.stringify(body);
          } else {
            serializedBody = String(body);
          }
        }
        const fetchOptions: RequestInit = {
          method,
          headers,
          body: serializedBody,
        };

        fetch(url, fetchOptions)
          .then(async (res) => {
            clearTimeout(timeoutId);
            let data: any;
            switch (responseType) {
              case 'json':
                data = await res.json();
                break;
              case 'text':
                data = await res.text();
                break;
              case 'arraybuffer':
                data = await res.arrayBuffer();
                break;
              default:
                data = await res.json();
            }

            const response: Response<T> = {
              data,
              status: res.status,
              statusText: res.statusText,
              headers: {} as Record<string, string>,
              config,
            };

            // 收集响应头
            res.headers.forEach((value: string, key: string) => {
              response.headers[key] = value;
            });

            if (res.ok) {
              resolve(response);
            } else {
              reject(new HttpError(`Request failed with status ${res.status}`, res.status, config, response));
            }
          })
          .catch((err) => {
            clearTimeout(timeoutId);
            reject(new HttpError(err.message || 'Request failed', 0, config));
          });
      }
    });
  }

  /**
   * GET请求
   */
  async get<T = any>(url: string, params?: Record<string, string | number>): Promise<Response<T>> {
    return this.request<T>({ url, method: 'GET', params });
  }

  /**
   * POST请求
   */
  async post<T = any>(url: string, data?: any): Promise<Response<T>> {
    return this.request<T>({ url, method: 'POST', body: data });
  }

  /**
   * PUT请求
   */
  async put<T = any>(url: string, data?: any): Promise<Response<T>> {
    return this.request<T>({ url, method: 'PUT', body: data });
  }

  /**
   * DELETE请求
   */
  async delete<T = any>(url: string): Promise<Response<T>> {
    return this.request<T>({ url, method: 'DELETE' });
  }

  /**
   * 延迟
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * 创建HTTP客户端实例
 */
export function createHttpClient(config?: Partial<RequestConfig>): HttpClient {
  return new HttpClient(config);
}

/**
 * 默认HTTP客户端实例
 */
export const http = new HttpClient();