// 网络模块：提供WebSocket和HTTP请求能力
export { WebSocketClient, WebSocketState, JsonSerializer, createWebSocket } from './WebSocket';
export type { WebSocketConfig, MessageSerializer, WebSocketMessage } from './WebSocket';

export { HttpClient, HttpError, createHttpClient, http } from './HttpClient';
export type { RequestConfig, Response } from './HttpClient';