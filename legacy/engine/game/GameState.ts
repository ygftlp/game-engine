// 游戏状态机：管理游戏生命周期状态（菜单、游戏、暂停、结算等）。

/** 游戏状态类型 */
export type GameStateType = 'init' | 'menu' | 'loading' | 'playing' | 'paused' | 'gameover' | 'victory' | 'settings' | 'credits';

/** 游戏事件 */
export type GameEvent = 'enter' | 'exit' | 'pause' | 'resume' | 'update' | 'input' | 'custom';

/** 游戏状态配置 */
export interface GameStateConfig {
  /** 是否允许暂停 */
  allowPause?: boolean;
  /** 是否允许输入 */
  allowInput?: boolean;
  /** 是否更新逻辑 */
  updateLogic?: boolean;
  /** 是否渲染 */
  render?: boolean;
}

/**
 * 游戏状态基类
 */
export abstract class GameState {
  name: GameStateType;
  config: GameStateConfig;

  constructor(name: GameStateType, config?: GameStateConfig) {
    this.name = name;
    this.config = {
      allowPause: true,
      allowInput: true,
      updateLogic: true,
      render: true,
      ...config,
    };
  }

  /** 进入状态 */
  abstract onEnter(data?: unknown): void;

  /** 退出状态 */
  abstract onExit(): void;

  /** 每帧更新 */
  abstract onUpdate(dt: number): void;

  /** 渲染 */
  abstract onRender(): void;

  /** 处理输入 */
  abstract onInput(event: string, data?: unknown): void;

  /** 暂停 */
  onPause(): void {}

  /** 恢复 */
  onResume(): void {}
}

/**
 * 游戏状态管理器
 */
export class GameStateManager {
  private states = new Map<GameStateType, GameState>();
  private currentState: GameState | null = null;
  private previousState: GameStateType | null = null;
  private stateHistory: GameStateType[] = [];
  private maxHistory = 10;

  /** 注册游戏状态 */
  registerState(state: GameState): void {
    this.states.set(state.name, state);
  }

  /** 设置初始状态 */
  setInitialState(type: GameStateType): void {
    const state = this.states.get(type);
    if (state) {
      this.currentState = state;
      this.currentState.onEnter();
    }
  }

  /** 转换到新状态 */
  transitionTo(type: GameStateType, data?: unknown): boolean {
    const newState = this.states.get(type);
    if (!newState) return false;

    if (this.currentState) {
      this.currentState.onExit();
    }

    this.previousState = this.currentState?.name ?? null;
    if (this.previousState) {
      this.stateHistory.push(this.previousState);
      if (this.stateHistory.length > this.maxHistory) {
        this.stateHistory.shift();
      }
    }

    this.currentState = newState;
    this.currentState.onEnter(data);
    return true;
  }

  /** 回退到上一个状态 */
  goBack(): boolean {
    if (this.stateHistory.length === 0) return false;
    const prevState = this.stateHistory.pop()!;
    return this.transitionTo(prevState);
  }

  /** 暂停当前状态 */
  pause(): void {
    if (this.currentState?.config.allowPause) {
      this.currentState.onPause();
    }
  }

  /** 恢复当前状态 */
  resume(): void {
    this.currentState?.onResume();
  }

  /** 每帧更新 */
  update(dt: number): void {
    if (this.currentState?.config.updateLogic) {
      this.currentState.onUpdate(dt);
    }
  }

  /** 渲染 */
  render(): void {
    if (this.currentState?.config.render) {
      this.currentState.onRender();
    }
  }

  /** 处理输入 */
  handleInput(event: string, data?: unknown): void {
    if (this.currentState?.config.allowInput) {
      this.currentState.onInput(event, data);
    }
  }

  /** 获取当前状态 */
  getCurrentState(): GameState | null {
    return this.currentState;
  }

  /** 获取当前状态名 */
  getCurrentStateName(): GameStateType | null {
    return this.currentState?.name ?? null;
  }

  /** 获取上一个状态名 */
  getPreviousStateName(): GameStateType | null {
    return this.previousState;
  }

  /** 是否处于指定状态 */
  isState(type: GameStateType): boolean {
    return this.currentState?.name === type;
  }

  /** 清除所有状态 */
  clear(): void {
    if (this.currentState) {
      this.currentState.onExit();
    }
    this.states.clear();
    this.currentState = null;
    this.previousState = null;
    this.stateHistory.length = 0;
  }
}

// ========== 预设游戏状态 ==========

/** 菜单状态 */
export class MenuState extends GameState {
  private onMenuAction: (action: string) => void;

  constructor(onMenuAction: (action: string) => void) {
    super('menu', { allowPause: false });
    this.onMenuAction = onMenuAction;
  }

  onEnter(): void {
    console.log('Entering menu');
  }

  onExit(): void {
    console.log('Exiting menu');
  }

  onUpdate(_dt: number): void {}

  onRender(): void {}

  onInput(event: string): void {
    if (event === 'start_game') {
      this.onMenuAction('start');
    } else if (event === 'settings') {
      this.onMenuAction('settings');
    }
  }
}

/** 游戏进行中状态 */
export class PlayingState extends GameState {
  private gameLogic: (dt: number) => void;
  private renderFn: () => void;

  constructor(gameLogic: (dt: number) => void, renderFn: () => void) {
    super('playing');
    this.gameLogic = gameLogic;
    this.renderFn = renderFn;
  }

  onEnter(): void {
    console.log('Game started');
  }

  onExit(): void {
    console.log('Game exited');
  }

  onUpdate(dt: number): void {
    this.gameLogic(dt);
  }

  onRender(): void {
    this.renderFn();
  }

  onInput(_event: string, _data?: unknown): void {}

  onPause(): void {
    console.log('Game paused');
  }

  onResume(): void {
    console.log('Game resumed');
  }
}

/** 暂停状态 */
export class PausedState extends GameState {
  private onResumeCallback: () => void;

  constructor(onResumeCallback: () => void) {
    super('paused', { updateLogic: false });
    this.onResumeCallback = onResumeCallback;
  }

  onEnter(): void {
    console.log('Game paused');
  }

  onExit(): void {
    console.log('Game unpaused');
  }

  onUpdate(_dt: number): void {}

  onRender(): void {}

  onInput(event: string): void {
    if (event === 'resume') {
      this.onResumeCallback();
    }
  }
}

/** 游戏结束状态 */
export class GameOverState extends GameState {
  private onRestart: () => void;
  private onMenu: () => void;

  constructor(onRestart: () => void, onMenu: () => void) {
    super('gameover', { updateLogic: false });
    this.onRestart = onRestart;
    this.onMenu = onMenu;
  }

  onEnter(): void {
    console.log('Game Over');
  }

  onExit(): void {}

  onUpdate(_dt: number): void {}

  onRender(): void {}

  onInput(event: string): void {
    if (event === 'restart') {
      this.onRestart();
    } else if (event === 'menu') {
      this.onMenu();
    }
  }
}
