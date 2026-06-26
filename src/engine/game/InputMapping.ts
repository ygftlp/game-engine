// 输入映射：支持按键映射、触摸手势、输入动作绑定。

/** 输入动作类型 */
export type InputActionType = 'button' | 'axis' | 'gesture';

/** 按键绑定 */
export interface KeyBinding {
  /** 动作名 */
  action: string;
  /** 按键码 */
  key: string;
  /** 是否按住触发（默认按下触发） */
  hold?: boolean;
  /** 长按时间（秒） */
  longPressTime?: number;
}

/** 轴绑定 */
export interface AxisBinding {
  /** 轴名 */
  axis: string;
  /** 正方向按键 */
  positive: string;
  /** 负方向按键 */
  negative: string;
  /** 轴值范围 */
  deadZone?: number;
}

/** 触摸手势绑定 */
export interface GestureBinding {
  /** 动作名 */
  action: string;
  /** 手势类型 */
  gesture: 'tap' | 'doubleTap' | 'longPress' | 'swipe' | 'pinch' | 'pan';
  /** 滑动方向（swipe 用） */
  direction?: 'up' | 'down' | 'left' | 'right';
  /** 滑动最小距离（px） */
  minDistance?: number;
}

/** 输入状态 */
export interface InputState {
  /** 按键是否按下 */
  pressed: boolean;
  /** 按键是否刚刚按下 */
  justPressed: boolean;
  /** 按键是否刚刚释放 */
  justReleased: boolean;
  /** 按住时间 */
  holdTime: number;
}

/**
 * 输入映射管理器
 */
export class InputMapper {
  private keyBindings = new Map<string, KeyBinding[]>();
  private axisBindings = new Map<string, AxisBinding>();
  private gestureBindings = new Map<string, GestureBinding[]>();

  private keyStates = new Map<string, InputState>();
  private axisValues = new Map<string, number>();
  private actionStates = new Map<string, InputState>();
  private longPressFired = new Map<string, boolean>();

  /** 绑定按键 */
  bindKey(action: string, key: string, hold = false, longPressTime?: number): void {
    if (!this.keyBindings.has(action)) {
      this.keyBindings.set(action, []);
    }
    this.keyBindings.get(action)!.push({ action, key, hold, longPressTime });
  }

  /** 解绑按键 */
  unbindKey(action: string, key?: string): void {
    if (key) {
      const bindings = this.keyBindings.get(action);
      if (bindings) {
        const idx = bindings.findIndex(b => b.key === key);
        if (idx >= 0) bindings.splice(idx, 1);
      }
    } else {
      this.keyBindings.delete(action);
    }
  }

  /** 绑定轴 */
  bindAxis(axis: string, positive: string, negative: string, deadZone = 0.1): void {
    this.axisBindings.set(axis, { axis, positive, negative, deadZone });
  }

  /** 解绑轴 */
  unbindAxis(axis: string): void {
    this.axisBindings.delete(axis);
  }

  /** 绑定手势 */
  bindGesture(action: string, gesture: GestureBinding['gesture'], direction?: string, minDistance = 50): void {
    if (!this.gestureBindings.has(action)) {
      this.gestureBindings.set(action, []);
    }
    this.gestureBindings.get(action)!.push({ action, gesture, direction: direction as any, minDistance });
  }

  /** 解绑手势 */
  unbindGesture(action: string): void {
    this.gestureBindings.delete(action);
  }

  /** 处理按键按下 */
  onKeyDown(key: string): void {
    this.keyStates.set(key, {
      pressed: true,
      justPressed: true,
      justReleased: false,
      holdTime: 0,
    });

    // 更新绑定的动作状态
    for (const [action, bindings] of this.keyBindings) {
      for (const binding of bindings) {
        if (binding.key === key) {
          this.updateActionState(action, true);
          if (binding.longPressTime !== undefined) {
            this.longPressFired.set(action, false);
          }
        }
      }
    }
  }

  /** 处理按键释放 */
  onKeyUp(key: string): void {
    const state = this.keyStates.get(key);
    if (state) {
      state.pressed = false;
      state.justReleased = true;
      state.holdTime = 0;
    }

    // 更新绑定的动作状态
    for (const [action, bindings] of this.keyBindings) {
      for (const binding of bindings) {
        if (binding.key === key) {
          this.updateActionState(action, false);
        }
      }
    }
  }

  /** 处理触摸手势 */
  onGesture(gesture: string, data?: { direction?: string; distance?: number; scale?: number }): void {
    for (const [action, bindings] of this.gestureBindings) {
      for (const binding of bindings) {
        if (binding.gesture === gesture) {
          if (binding.direction && data?.direction !== binding.direction) continue;
          if (binding.minDistance && (data?.distance ?? 0) < binding.minDistance) continue;

          this.updateActionState(action, true);
          setTimeout(() => this.updateActionState(action, false), 100);
        }
      }
    }
  }

  /** 获取动作状态 */
  getActionState(action: string): InputState {
    return this.actionStates.get(action) ?? {
      pressed: false,
      justPressed: false,
      justReleased: false,
      holdTime: 0,
    };
  }

  /** 检查动作是否按下 */
  isActionPressed(action: string): boolean {
    return this.actionStates.get(action)?.pressed ?? false;
  }

  /** 检查动作是否刚刚按下 */
  isActionJustPressed(action: string): boolean {
    return this.actionStates.get(action)?.justPressed ?? false;
  }

  /** 检查动作是否刚刚释放 */
  isActionJustReleased(action: string): boolean {
    return this.actionStates.get(action)?.justReleased ?? false;
  }

  /** 获取轴值 */
  getAxis(axis: string): number {
    return this.axisValues.get(axis) ?? 0;
  }

  /** 获取 2D 轴值 */
  getAxis2D(horizontal: string, vertical: string): { x: number; y: number } {
    return {
      x: this.getAxis(horizontal),
      y: this.getAxis(vertical),
    };
  }

  /** 每帧更新 */
  update(dt: number): void {
    // 更新按住时间
    for (const [, state] of this.keyStates) {
      if (state.pressed) {
        state.holdTime += dt;
      }
      state.justPressed = false;
      state.justReleased = false;
    }

    // 更新动作按住时间
    for (const [, state] of this.actionStates) {
      if (state.pressed) {
        state.holdTime += dt;
      }
      state.justPressed = false;
      state.justReleased = false;
    }

    // 更新轴值
    for (const [axis, binding] of this.axisBindings) {
      const positive = this.keyStates.get(binding.positive)?.pressed ?? false;
      const negative = this.keyStates.get(binding.negative)?.pressed ?? false;

      let value = 0;
      if (positive) value += 1;
      if (negative) value -= 1;

      // 应用死区
      if (Math.abs(value) < (binding.deadZone ?? 0.1)) {
        value = 0;
      }

      this.axisValues.set(axis, value);
    }

    // 检测长按
    for (const [action, bindings] of this.keyBindings) {
      for (const binding of bindings) {
        if (binding.longPressTime === undefined) continue;
        if (this.longPressFired.get(action)) continue;

        const keyState = this.keyStates.get(binding.key);
        if (keyState?.pressed && keyState.holdTime >= binding.longPressTime) {
          this.longPressFired.set(action, true);
          this.actionStates.set(action, {
            pressed: true,
            justPressed: false,
            justReleased: false,
            holdTime: keyState.holdTime,
          });
        }
      }
    }
  }

  /** 清除所有绑定 */
  clear(): void {
    this.keyBindings.clear();
    this.axisBindings.clear();
    this.gestureBindings.clear();
    this.keyStates.clear();
    this.axisValues.clear();
    this.actionStates.clear();
    this.longPressFired.clear();
  }

  /** 获取所有绑定的按键 */
  getKeyBindings(): Map<string, KeyBinding[]> {
    return new Map(this.keyBindings);
  }

  /** 获取所有绑定的轴 */
  getAxisBindings(): Map<string, AxisBinding> {
    return new Map(this.axisBindings);
  }

  /** 获取所有绑定的手势 */
  getGestureBindings(): Map<string, GestureBinding[]> {
    return new Map(this.gestureBindings);
  }

  private updateActionState(action: string, pressed: boolean): void {
    const existing = this.actionStates.get(action);
    this.actionStates.set(action, {
      pressed,
      justPressed: pressed && !(existing?.pressed ?? false),
      justReleased: !pressed && (existing?.pressed ?? false),
      holdTime: existing?.holdTime ?? 0,
    });
  }
}

// ========== 预设输入配置 ==========

/** 创建移动输入配置（WASD + 方向键） */
export function createMovementBindings(mapper: InputMapper): void {
  // 水平轴
  mapper.bindAxis('horizontal', 'KeyD', 'KeyA');
  mapper.bindAxis('horizontal', 'ArrowRight', 'ArrowLeft');

  // 垂直轴
  mapper.bindAxis('vertical', 'KeyS', 'KeyW');
  mapper.bindAxis('vertical', 'ArrowDown', 'ArrowUp');
}

/** 创建游戏动作绑定 */
export function createGameBindings(mapper: InputMapper): void {
  mapper.bindKey('jump', 'Space');
  mapper.bindKey('attack', 'KeyJ');
  mapper.bindKey('special', 'KeyK');
  mapper.bindKey('interact', 'KeyE');
  mapper.bindKey('pause', 'Escape');
}

/** 创建 UI 输入绑定 */
export function createUIBindings(mapper: InputMapper): void {
  mapper.bindKey('confirm', 'Enter');
  mapper.bindKey('cancel', 'Escape');
  mapper.bindKey('navigate_up', 'ArrowUp');
  mapper.bindKey('navigate_down', 'ArrowDown');
  mapper.bindKey('navigate_left', 'ArrowLeft');
  mapper.bindKey('navigate_right', 'ArrowRight');
}
