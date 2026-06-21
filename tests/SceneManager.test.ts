import { describe, it, expect, vi } from 'vitest';
import { SceneManager } from '../src/engine/core/SceneManager';
import { Scene } from '../src/engine/core/Scene';

describe('SceneManager', () => {
  function createScene(name: string): Scene {
    const scene = new Scene();
    scene.onEnter = vi.fn();
    scene.onExit = vi.fn();
    (scene as any)._name = name;
    return scene;
  }

  it('should start with empty stack', () => {
    const manager = new SceneManager();
    expect(manager.current()).toBeNull();
    expect(manager.size()).toBe(0);
  });

  it('should push scene', () => {
    const manager = new SceneManager();
    const scene = createScene('A');
    manager.push(scene);
    expect(manager.current()).toBe(scene);
    expect(manager.size()).toBe(1);
    expect(scene.onEnter).toHaveBeenCalledTimes(1);
  });

  it('should push multiple scenes', () => {
    const manager = new SceneManager();
    const a = createScene('A');
    const b = createScene('B');
    manager.push(a);
    manager.push(b);
    expect(manager.current()).toBe(b);
    expect(manager.size()).toBe(2);
    expect(a.onExit).toHaveBeenCalledTimes(1);
    expect(b.onEnter).toHaveBeenCalledTimes(1);
  });

  it('should pop scene', () => {
    const manager = new SceneManager();
    const a = createScene('A');
    const b = createScene('B');
    manager.push(a);
    manager.push(b);
    const popped = manager.pop();
    expect(popped).toBe(b);
    expect(manager.current()).toBe(a);
    expect(manager.size()).toBe(1);
    expect(b.onExit).toHaveBeenCalledTimes(1);
    expect(a.onEnter).toHaveBeenCalledTimes(2);
  });

  it('should return null when pop empty stack', () => {
    const manager = new SceneManager();
    expect(manager.pop()).toBeNull();
  });

  it('should replace scene', () => {
    const manager = new SceneManager();
    const a = createScene('A');
    const b = createScene('B');
    manager.push(a);
    manager.replace(b);
    expect(manager.current()).toBe(b);
    expect(manager.size()).toBe(1);
    expect(a.onExit).toHaveBeenCalledTimes(1);
    expect(b.onEnter).toHaveBeenCalledTimes(1);
  });

  it('should clear stack', () => {
    const manager = new SceneManager();
    const a = createScene('A');
    const b = createScene('B');
    manager.push(a);
    manager.push(b);
    manager.clear();
    expect(manager.current()).toBeNull();
    expect(manager.size()).toBe(0);
    // b.onExit called once (during clear), a.onExit called twice (once when b pushed, once during clear)
    expect(b.onExit).toHaveBeenCalledTimes(1);
    expect(a.onExit).toHaveBeenCalledTimes(2);
  });

  it('should get all scenes', () => {
    const manager = new SceneManager();
    const a = createScene('A');
    const b = createScene('B');
    manager.push(a);
    manager.push(b);
    const all = manager.getAll();
    expect(all).toEqual([a, b]);
  });

  it('should not push duplicate scene', () => {
    const manager = new SceneManager();
    const a = createScene('A');
    manager.push(a);
    manager.push(a);
    expect(manager.size()).toBe(1);
  });
});