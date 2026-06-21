import { describe, it, expect } from 'vitest';
import { AnimationClip } from '../src/engine/render/AnimationClip';

describe('AnimationClip', () => {
  const frames = [
    { x: 0, y: 0, width: 32, height: 32 },
    { x: 32, y: 0, width: 32, height: 32 },
    { x: 64, y: 0, width: 32, height: 32 },
    { x: 96, y: 0, width: 32, height: 32 },
  ];

  it('should create with default values', () => {
    const clip = new AnimationClip({ frames });
    expect(clip.frames).toBe(frames);
    expect(clip.fps).toBe(12);
    expect(clip.mode).toBe('loop');
    expect(clip.name).toBe('');
  });

  it('should create with custom values', () => {
    const clip = new AnimationClip({
      frames,
      fps: 24,
      mode: 'once',
      name: 'walk',
    });
    expect(clip.fps).toBe(24);
    expect(clip.mode).toBe('once');
    expect(clip.name).toBe('walk');
  });

  it('should calculate frame duration', () => {
    const clip = new AnimationClip({ frames, fps: 10 });
    expect(clip.frameDuration).toBeCloseTo(0.1);
  });

  it('should calculate total duration', () => {
    const clip = new AnimationClip({ frames, fps: 10 });
    expect(clip.totalDuration).toBeCloseTo(0.4);
  });

  it('should get frame index in loop mode', () => {
    const clip = new AnimationClip({ frames, fps: 10, mode: 'loop' });
    expect(clip.getFrameIndex(0)).toBe(0);
    expect(clip.getFrameIndex(0.05)).toBe(0);
    expect(clip.getFrameIndex(0.1)).toBe(1);
    expect(clip.getFrameIndex(0.29)).toBe(2);
    expect(clip.getFrameIndex(0.4)).toBe(0); // wrap around
    expect(clip.getFrameIndex(0.45)).toBe(0);
  });

  it('should get frame index in once mode', () => {
    const clip = new AnimationClip({ frames, fps: 10, mode: 'once' });
    expect(clip.getFrameIndex(0)).toBe(0);
    expect(clip.getFrameIndex(0.1)).toBe(1);
    expect(clip.getFrameIndex(0.29)).toBe(2);
    expect(clip.getFrameIndex(0.4)).toBe(3); // clamped to last
    expect(clip.getFrameIndex(1)).toBe(3);
  });

  it('should get frame', () => {
    const clip = new AnimationClip({ frames, fps: 10, mode: 'loop' });
    expect(clip.getFrame(0)).toBe(frames[0]);
    expect(clip.getFrame(0.1)).toBe(frames[1]);
    expect(clip.getFrame(0.29)).toBe(frames[2]);
  });

  it('should check if finished in once mode', () => {
    const clip = new AnimationClip({ frames, fps: 10, mode: 'once' });
    expect(clip.isFinished(0)).toBe(false);
    expect(clip.isFinished(0.3)).toBe(false);
    expect(clip.isFinished(0.4)).toBe(true);
    expect(clip.isFinished(1)).toBe(true);
  });

  it('should never finish in loop mode', () => {
    const clip = new AnimationClip({ frames, fps: 10, mode: 'loop' });
    expect(clip.isFinished(0)).toBe(false);
    expect(clip.isFinished(100)).toBe(false);
  });
});