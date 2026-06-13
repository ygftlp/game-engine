// 引擎统一入口：对外暴露清晰的 API。核心与平台无关，适配器可按需导入。
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

// 平台接口与各端适配器（按需在各平台入口中导入其一）
export type { IPlatform } from './platform/Platform';
export { WxPlatform } from './platform/WxPlatform';
export { TtPlatform } from './platform/TtPlatform';
export { H5Platform } from './platform/H5Platform';
