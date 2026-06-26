// 有限状态机：支持状态、转换、守卫条件、历史状态。

/** 状态机状态基类 */
export abstract class FSMState {
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  /** 进入状态时调用 */
  abstract onEnter(data?: unknown): void;

  /** 每帧更新 */
  abstract onUpdate(dt: number): void;

  /** 退出状态时调用 */
  abstract onExit(): void;

  /** 可覆盖：检查是否可以转换到目标状态 */
  canTransitionTo(_targetState: string): boolean {
    return true;
  }
}

/** 状态转换规则 */
export interface Transition {
  /** 目标状态名 */
  target: string;
  /** 守卫条件 */
  guard?: () => boolean;
  /** 转换优先级（数字越大优先级越高） */
  priority?: number;
}

/**
 * 有限状态机
 */
export class FSM {
  private states = new Map<string, FSMState>();
  private transitions = new Map<string, Transition[]>();
  private currentState: FSMState | null = null;
  private previousStateName: string | null = null;
  private history: string[] = [];
  private maxHistory = 10;

  /** 添加状态 */
  addState(state: FSMState): void {
    this.states.set(state.name, state);
  }

  /** 添加转换规则 */
  addTransition(from: string, to: string, guard?: () => boolean, priority = 0): void {
    if (!this.transitions.has(from)) {
      this.transitions.set(from, []);
    }
    this.transitions.get(from)!.push({ target: to, guard, priority });
    // 按优先级排序
    this.transitions.get(from)!.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  }

  /** 设置初始状态 */
  setInitialState(stateName: string): void {
    const state = this.states.get(stateName);
    if (state) {
      this.currentState = state;
      this.currentState.onEnter();
    }
  }

  /** 获取所有状态名 */
  getStateNames(): string[] {
    return [...this.states.keys()];
  }

  /** 获取当前状态名 */
  getCurrentStateName(): string | null {
    return this.currentState?.name ?? null;
  }

  /** 获取当前状态 */
  getCurrentState(): FSMState | null {
    return this.currentState;
  }

  /** 获取上一个状态名 */
  getPreviousStateName(): string | null {
    return this.previousStateName;
  }

  /** 强制转换到指定状态 */
  transitionTo(stateName: string, data?: unknown): boolean {
    const newState = this.states.get(stateName);
    if (!newState) return false;

    if (this.currentState) {
      if (!this.currentState.canTransitionTo(stateName)) {
        return false;
      }
      this.currentState.onExit();
    }

    this.previousStateName = this.currentState?.name ?? null;
    if (this.previousStateName) {
      this.history.push(this.previousStateName);
      if (this.history.length > this.maxHistory) {
        this.history.shift();
      }
    }

    this.currentState = newState;
    this.currentState.onEnter(data);
    return true;
  }

  /** 检查并执行自动转换 */
  checkTransitions(): void {
    if (!this.currentState) return;

    const transitions = this.transitions.get(this.currentState.name);
    if (!transitions) return;

    for (const transition of transitions) {
      if (transition.guard && !transition.guard()) continue;
      this.transitionTo(transition.target);
      return;
    }
  }

  /** 每帧更新 */
  update(dt: number): void {
    if (this.currentState) {
      this.currentState.onUpdate(dt);
    }
    this.checkTransitions();
  }

  /** 回退到上一个状态 */
  goBack(): boolean {
    if (this.history.length === 0) return false;
    const prevStateName = this.history.pop()!;
    return this.transitionTo(prevStateName);
  }

  /** 获取状态历史 */
  getHistory(): string[] {
    return [...this.history];
  }

  /** 是否处于指定状态 */
  isState(stateName: string): boolean {
    return this.currentState?.name === stateName;
  }

  /** 清除所有状态和转换 */
  clear(): void {
    this.states.clear();
    this.transitions.clear();
    this.currentState = null;
    this.previousStateName = null;
    this.history.length = 0;
  }
}

// ========== 层级状态机 ==========

/** 层级状态机节点 */
export interface HSMNode {
  name: string;
  parent?: string;
}

/**
 * 层级状态机：支持嵌套状态。
 */
export class HierarchicalFSM {
  private states = new Map<string, HSMNode>();
  private currentState: string | null = null;
  private subMachines = new Map<string, FSM>();

  /** 添加层级状态 */
  addState(name: string, parent?: string): void {
    this.states.set(name, { name, parent });
  }

  /** 添加子状态机 */
  addSubMachine(parentState: string, fsm: FSM): void {
    this.subMachines.set(parentState, fsm);
  }

  /** 设置初始状态 */
  setInitialState(stateName: string): void {
    this.currentState = stateName;
    const subFSM = this.subMachines.get(stateName);
    if (subFSM && subFSM.getCurrentState() === null) {
      const subStates = subFSM.getStateNames();
      if (subStates.length > 0) {
        subFSM.setInitialState(subStates[0]);
      }
    }
  }

  /** 转换状态 */
  transitionTo(stateName: string): void {
    if (this.currentState) {
      const subFSM = this.subMachines.get(this.currentState);
      if (subFSM) {
        subFSM.clear();
      }
    }
    this.currentState = stateName;
    const subFSM = this.subMachines.get(stateName);
    if (subFSM) {
      const subStates = subFSM.getStateNames();
      if (subStates.length > 0) {
        subFSM.setInitialState(subStates[0]);
      }
    }
  }

  /** 获取当前状态 */
  getCurrentState(): string | null {
    return this.currentState;
  }

  /** 获取当前子状态机 */
  getSubMachine(stateName: string): FSM | undefined {
    return this.subMachines.get(stateName);
  }

  /** 每帧更新 */
  update(dt: number): void {
    if (this.currentState) {
      const subFSM = this.subMachines.get(this.currentState);
      if (subFSM) {
        subFSM.update(dt);
      }
    }
  }
}
