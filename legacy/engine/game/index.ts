// 游戏框架统一导出
export { GameStateManager, GameState, MenuState, PlayingState, PausedState, GameOverState } from './GameState';
export type { GameStateType, GameEvent, GameStateConfig } from './GameState';

export { SaveManager, QuickSave } from './SaveSystem';
export type { SaveData, SaveConfig } from './SaveSystem';

export { ScoreManager, AchievementManager, StatsTracker } from './ScoreSystem';
export type { Achievement, UnlockedAchievement, GameStats, ScoreEvent } from './ScoreSystem';

export { InputMapper, createMovementBindings, createGameBindings, createUIBindings } from './InputMapping';
export type { KeyBinding, AxisBinding, GestureBinding, InputState, InputActionType } from './InputMapping';
