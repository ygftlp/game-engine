import { describe, it, expect, vi } from 'vitest';
import { EventEmitter } from '../src/engine/core/EventEmitter';

describe('EventEmitter', () => {
  it('should register and emit events', () => {
    const emitter = new EventEmitter();
    const listener = vi.fn();
    emitter.on('test', listener);
    emitter.emit('test', 'arg1', 'arg2');
    expect(listener).toHaveBeenCalledWith('arg1', 'arg2');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('should register multiple listeners', () => {
    const emitter = new EventEmitter();
    const listener1 = vi.fn();
    const listener2 = vi.fn();
    emitter.on('test', listener1);
    emitter.on('test', listener2);
    emitter.emit('test');
    expect(listener1).toHaveBeenCalledTimes(1);
    expect(listener2).toHaveBeenCalledTimes(1);
  });

  it('should register once listeners', () => {
    const emitter = new EventEmitter();
    const listener = vi.fn();
    emitter.once('test', listener);
    emitter.emit('test');
    emitter.emit('test');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('should remove specific listener', () => {
    const emitter = new EventEmitter();
    const listener1 = vi.fn();
    const listener2 = vi.fn();
    emitter.on('test', listener1);
    emitter.on('test', listener2);
    emitter.off('test', listener1);
    emitter.emit('test');
    expect(listener1).not.toHaveBeenCalled();
    expect(listener2).toHaveBeenCalledTimes(1);
  });

  it('should remove all listeners for event', () => {
    const emitter = new EventEmitter();
    const listener1 = vi.fn();
    const listener2 = vi.fn();
    emitter.on('test', listener1);
    emitter.on('test', listener2);
    emitter.offAll('test');
    emitter.emit('test');
    expect(listener1).not.toHaveBeenCalled();
    expect(listener2).not.toHaveBeenCalled();
  });

  it('should clear all listeners', () => {
    const emitter = new EventEmitter();
    const listener1 = vi.fn();
    const listener2 = vi.fn();
    emitter.on('test1', listener1);
    emitter.on('test2', listener2);
    emitter.clear();
    emitter.emit('test1');
    emitter.emit('test2');
    expect(listener1).not.toHaveBeenCalled();
    expect(listener2).not.toHaveBeenCalled();
  });

  it('should return correct listener count', () => {
    const emitter = new EventEmitter();
    const listener1 = vi.fn();
    const listener2 = vi.fn();
    emitter.on('test', listener1);
    emitter.on('test', listener2);
    emitter.once('test', vi.fn());
    expect(emitter.listenerCount('test')).toBe(3);
    expect(emitter.listenerCount('other')).toBe(0);
  });

  it('should check if has listeners', () => {
    const emitter = new EventEmitter();
    expect(emitter.hasListeners('test')).toBe(false);
    emitter.on('test', vi.fn());
    expect(emitter.hasListeners('test')).toBe(true);
  });

  it('should chain methods', () => {
    const emitter = new EventEmitter();
    const listener = vi.fn();
    const result = emitter
      .on('test', listener)
      .once('test2', listener)
      .emit('test')
      .off('test', listener)
      .offAll('test2')
      .clear();
    expect(result).toBe(emitter);
  });
});