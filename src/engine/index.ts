// 引擎统一入口：对外暴露清晰的 API。核心与平台无关，适配器可按需导入。
export { Engine } from './Engine';
export { Scene } from './core/Scene';
export { Node } from './core/Node';
export { Ticker } from './core/Ticker';
export { EventEmitter } from './core/EventEmitter';
export { Pool } from './core/Pool';
export { Renderer } from './render/Renderer';
export { Camera } from './render/Camera';
export type { CameraConfig, CameraType } from './render/Camera';
export { Sprite } from './render/Sprite';
export { TextNode } from './render/TextNode';
export { Texture } from './render/Texture';
export type { TextureFrame } from './render/Texture';
export { Input } from './input/Input';
export type { TouchPoint, InputListener, InputListenerOptions } from './input/Input';
export { Loader } from './loader/Loader';
export type { ResourceDescriptor, ResourceType } from './loader/Loader';
export { Audio } from './audio/Audio';
export { Collision } from './collision/Collision';
export type { Rect, Circle } from './collision/Collision';
export { Vec2 } from './math/Vec2';
export { Matrix2D } from './math/Matrix2D';
export { Vec3, Mat4, Quat } from './math/Mat4';
export { Logger, LogLevel } from './utils/Logger';
export type { LogEntry, LoggerConfig, LoggerPlatform } from './utils/Logger';

// UI 组件
export { UIWidget } from './ui/UIWidget';
export type { UIAlign, UIImageStretch, UIState, UIVAlign } from './ui/UIWidget';
export { UIManager, UIEvent } from './ui/UIManager';
export type { UIEventHandler } from './ui/UIManager';
export { Button } from './ui/Button';
export type { ButtonStyle, ButtonState } from './ui/Button';
export { ScrollView, ListView } from './ui/ScrollView';
export type { ScrollDirection, ScrollbarConfig, ScrollEvent } from './ui/ScrollView';

// 平台接口与各端适配器（按需在各平台入口中导入其一）
export type { IPlatform, ICanvas, IImage, IAudio, ScreenInfo, PointerPoint, PointerHandler } from './platform/Platform';
export { WxPlatform } from './platform/WxPlatform';
export { TtPlatform } from './platform/TtPlatform';
export { H5Platform } from './platform/H5Platform';
