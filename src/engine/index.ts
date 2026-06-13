// 引擎统一入口：对外暴露清晰的 API，便于在多个微信小游戏中复用。
export { Engine } from './Engine';
export { Scene } from './core/Scene';
export { Node } from './core/Node';
export { Ticker } from './core/Ticker';
export { Renderer } from './render/Renderer';
export { Sprite } from './render/Sprite';
export { Texture } from './render/Texture';
export { Input } from './input/Input';
export type { TouchPoint } from './input/Input';
export { Loader } from './loader/Loader';
export { Audio } from './audio/Audio';
export { Collision } from './collision/Collision';
export type { Rect, Circle } from './collision/Collision';
export { Vec2 } from './math/Vec2';
export { WxPlatform } from './platform/WxPlatform';
export type { IPlatform } from './platform/Platform';
