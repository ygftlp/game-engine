// 音频模块统一导出
export { AudioManager, ManagedAudio } from './AudioManager';
export type { AudioCategory, AudioCategoryConfig } from './AudioManager';
export { AudioMixer } from './AudioMixer';
export type { BusNode } from './AudioMixer';
export { SpatialAudioSource, SpatialAudioListener, ReverbEffect } from './SpatialAudio';
export type { SpatialAudioConfig } from './SpatialAudio';
export { AudioEffectChain } from './AudioEffects';
export type { AudioEffectType, AudioEffectConfig } from './AudioEffects';
export { createVoicePreset, createUnderwaterPreset, createTelephonePreset } from './AudioEffects';
export { AudioSprite, AudioSpriteManager } from './AudioSprite';
export type { AudioSpriteFrame } from './AudioSprite';
