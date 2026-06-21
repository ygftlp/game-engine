import { describe, it, expect, vi } from 'vitest';
import { Pool } from '../src/engine/core/Pool';

describe('Pool', () => {
  it('should create objects from factory', () => {
    const factory = vi.fn(() => ({ value: 0 }));
    const reset = vi.fn();
    const pool = new Pool(factory, reset);
    const obj = pool.acquire();
    expect(factory).toHaveBeenCalledTimes(1);
    expect(obj).toEqual({ value: 0 });
  });

  it('should reuse objects from pool', () => {
    const factory = vi.fn(() => ({ value: 0 }));
    const reset = vi.fn();
    const pool = new Pool(factory, reset);
    const obj1 = pool.acquire();
    pool.release(obj1);
    const obj2 = pool.acquire();
    expect(factory).toHaveBeenCalledTimes(1);
    expect(obj2).toBe(obj1);
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it('should respect max size', () => {
    const factory = () => ({ value: 0 });
    const reset = () => {};
    const pool = new Pool(factory, reset, 2);
    const obj1 = pool.acquire();
    const obj2 = pool.acquire();
    const obj3 = pool.acquire();
    pool.release(obj1);
    pool.release(obj2);
    pool.release(obj3); // should not be added to pool
    expect(pool.size).toBe(2);
  });

  it('should warm up pool', () => {
    const factory = vi.fn(() => ({ value: 0 }));
    const reset = () => {};
    const pool = new Pool(factory, reset, 0, 3);
    expect(factory).toHaveBeenCalledTimes(3);
    expect(pool.size).toBe(3);
  });

  it('should clear pool', () => {
    const factory = () => ({ value: 0 });
    const reset = () => {};
    const pool = new Pool(factory, reset, 0, 3);
    expect(pool.size).toBe(3);
    pool.clear();
    expect(pool.size).toBe(0);
  });

  it('should not exceed max size during warm up', () => {
    const factory = () => ({ value: 0 });
    const reset = () => {};
    const pool = new Pool(factory, reset, 2, 5);
    expect(pool.size).toBe(2);
  });
});