import { describe, it, expect, vi } from 'vitest';
import { TimerManager } from '../src/engine/utils/Timer';

describe('TimerManager', () => {
  it('should delay execution', () => {
    const manager = new TimerManager();
    const callback = vi.fn();
    manager.delay(callback, 1);
    expect(callback).not.toHaveBeenCalled();
    manager.update(0.5);
    expect(callback).not.toHaveBeenCalled();
    manager.update(0.6);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should interval execution', () => {
    const manager = new TimerManager();
    const callback = vi.fn();
    manager.interval(callback, 1);
    manager.update(1);
    expect(callback).toHaveBeenCalledTimes(1);
    manager.update(1);
    expect(callback).toHaveBeenCalledTimes(2);
    manager.update(1);
    expect(callback).toHaveBeenCalledTimes(3);
  });

  it('should cancel timer', () => {
    const manager = new TimerManager();
    const callback = vi.fn();
    const id = manager.delay(callback, 1);
    manager.cancel(id);
    manager.update(2);
    expect(callback).not.toHaveBeenCalled();
  });

  it('should pause and resume timer', () => {
    const manager = new TimerManager();
    const callback = vi.fn();
    const id = manager.delay(callback, 1);
    manager.pause(id);
    manager.update(2);
    expect(callback).not.toHaveBeenCalled();
    manager.resume(id);
    manager.update(0.5);
    expect(callback).not.toHaveBeenCalled();
    manager.update(0.6);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should clear all timers', () => {
    const manager = new TimerManager();
    manager.delay(() => {}, 1);
    manager.delay(() => {}, 2);
    manager.interval(() => {}, 1);
    expect(manager.size).toBe(3);
    manager.clear();
    expect(manager.size).toBe(0);
  });

  it('should handle multiple timers', () => {
    const manager = new TimerManager();
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    manager.delay(cb1, 1);
    manager.delay(cb2, 2);
    manager.update(1.5);
    expect(cb1).toHaveBeenCalledTimes(1);
    expect(cb2).not.toHaveBeenCalled();
    manager.update(1);
    expect(cb2).toHaveBeenCalledTimes(1);
  });
});