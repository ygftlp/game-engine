import { describe, it, expect, vi } from 'vitest';
import { FSM, FSMState } from '../src/state-machine/StateMachine';

class TestState extends FSMState {
  enterSpy = vi.fn();
  updateSpy = vi.fn();
  exitSpy = vi.fn();
  onEnter(data?: unknown): void { this.enterSpy(data); }
  onUpdate(dt: number): void { this.updateSpy(dt); }
  onExit(): void { this.exitSpy(); }
}

function makeFsm() {
  const fsm = new FSM();
  const idle = new TestState('idle');
  const run = new TestState('run');
  fsm.addState(idle);
  fsm.addState(run);
  return { fsm, idle, run };
}

describe('FSM', () => {
  it('enters the initial state and updates it', () => {
    const { fsm, idle } = makeFsm();
    fsm.setInitialState('idle');
    expect(fsm.getCurrentStateName()).toBe('idle');
    expect(idle.enterSpy).toHaveBeenCalledTimes(1);
    fsm.update(0.16);
    expect(idle.updateSpy).toHaveBeenCalledWith(0.16);
  });

  it('transitionTo exits the old state and enters the new one', () => {
    const { fsm, idle, run } = makeFsm();
    fsm.setInitialState('idle');
    expect(fsm.transitionTo('run')).toBe(true);
    expect(idle.exitSpy).toHaveBeenCalledTimes(1);
    expect(run.enterSpy).toHaveBeenCalledTimes(1);
    expect(fsm.isState('run')).toBe(true);
  });

  it('respects guards via checkTransitions', () => {
    const { fsm } = makeFsm();
    let open = false;
    fsm.addTransition('idle', 'run', () => open);
    fsm.setInitialState('idle');
    fsm.checkTransitions();
    expect(fsm.getCurrentStateName()).toBe('idle');
    open = true;
    fsm.checkTransitions();
    expect(fsm.getCurrentStateName()).toBe('run');
  });

  it('rejects transitions to unknown states', () => {
    const { fsm } = makeFsm();
    fsm.setInitialState('idle');
    expect(fsm.transitionTo('nope')).toBe(false);
    expect(fsm.getCurrentStateName()).toBe('idle');
  });
});
