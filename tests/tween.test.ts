import { describe, it, expect, vi } from 'vitest';
import { Tween, TweenManager, Easing } from '../src/tween/Tween';

describe('Tween', () => {
  it('interpolates a property over the duration and completes', () => {
    const target = { x: 0 };
    const done = vi.fn();
    const tween = new Tween(target).to({ x: 100 }, 1, Easing.linear);
    tween.on('complete', done);
    tween.start();
    tween.update(0.5);
    expect(target.x).toBeCloseTo(50);
    tween.update(0.5);
    expect(target.x).toBeCloseTo(100);
    expect(done).toHaveBeenCalledTimes(1);
  });

  it('manager drives and auto-removes completed tweens', () => {
    const target = { y: 0 };
    const manager = new TweenManager();
    manager.create(target).to({ y: 10 }, 0.5).start();
    manager.update(0.25);
    expect(target.y).toBeCloseTo(5);
    manager.update(0.25);
    expect(target.y).toBeCloseTo(10);
    // Completed tween was removed: further updates change nothing and do not throw.
    manager.update(1);
    expect(target.y).toBeCloseTo(10);
  });
});
