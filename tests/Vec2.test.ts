import { describe, it, expect } from 'vitest';
import { Vec2 } from '../src/engine/math/Vec2';

describe('Vec2', () => {
  it('should create with default values', () => {
    const v = new Vec2();
    expect(v.x).toBe(0);
    expect(v.y).toBe(0);
  });

  it('should create with custom values', () => {
    const v = new Vec2(3, 4);
    expect(v.x).toBe(3);
    expect(v.y).toBe(4);
  });

  it('should set values', () => {
    const v = new Vec2();
    v.set(5, 6);
    expect(v.x).toBe(5);
    expect(v.y).toBe(6);
  });

  it('should add vectors', () => {
    const a = new Vec2(1, 2);
    const b = new Vec2(3, 4);
    const result = a.add(b);
    expect(result.x).toBe(4);
    expect(result.y).toBe(6);
    expect(a.x).toBe(1); // original unchanged
    expect(a.y).toBe(2);
  });

  it('should subtract vectors', () => {
    const a = new Vec2(5, 7);
    const b = new Vec2(2, 3);
    const result = a.subtract(b);
    expect(result.x).toBe(3);
    expect(result.y).toBe(4);
  });

  it('should scale vector', () => {
    const v = new Vec2(2, 3);
    const result = v.scale(3);
    expect(result.x).toBe(6);
    expect(result.y).toBe(9);
  });

  it('should calculate length', () => {
    const v = new Vec2(3, 4);
    expect(v.length()).toBe(5);
  });

  it('should calculate length squared', () => {
    const v = new Vec2(3, 4);
    expect(v.lengthSquared()).toBe(25);
  });

  it('should normalize vector', () => {
    const v = new Vec2(3, 4);
    const normalized = v.normalize();
    expect(normalized.x).toBeCloseTo(0.6);
    expect(normalized.y).toBeCloseTo(0.8);
    expect(normalized.length()).toBeCloseTo(1);
  });

  it('should normalize zero vector', () => {
    const v = new Vec2(0, 0);
    const normalized = v.normalize();
    expect(normalized.x).toBe(0);
    expect(normalized.y).toBe(0);
  });

  it('should calculate dot product', () => {
    const a = new Vec2(1, 2);
    const b = new Vec2(3, 4);
    expect(a.dot(b)).toBe(11);
  });

  it('should calculate distance', () => {
    const a = new Vec2(0, 0);
    const b = new Vec2(3, 4);
    expect(a.distance(b)).toBe(5);
  });

  it('should calculate distance squared', () => {
    const a = new Vec2(0, 0);
    const b = new Vec2(3, 4);
    expect(a.distanceSquared(b)).toBe(25);
  });

  it('should lerp between vectors', () => {
    const a = new Vec2(0, 0);
    const b = new Vec2(10, 10);
    const result = a.lerp(b, 0.5);
    expect(result.x).toBe(5);
    expect(result.y).toBe(5);
  });

  it('should negate vector', () => {
    const v = new Vec2(3, -4);
    const result = v.negate();
    expect(result.x).toBe(-3);
    expect(result.y).toBe(4);
  });

  it('should check equality', () => {
    const a = new Vec2(1, 2);
    const b = new Vec2(1, 2);
    const c = new Vec2(1.0001, 2);
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
    expect(a.equals(c, 0.001)).toBe(true);
  });

  it('should clone vector', () => {
    const v = new Vec2(3, 4);
    const clone = v.clone();
    expect(clone.x).toBe(3);
    expect(clone.y).toBe(4);
    clone.set(5, 6);
    expect(v.x).toBe(3); // original unchanged
    expect(v.y).toBe(4);
  });

  it('should have static constants', () => {
    expect(Vec2.ZERO.x).toBe(0);
    expect(Vec2.ZERO.y).toBe(0);
    expect(Vec2.ONE.x).toBe(1);
    expect(Vec2.ONE.y).toBe(1);
    expect(Vec2.UP.x).toBe(0);
    expect(Vec2.UP.y).toBe(-1);
    expect(Vec2.DOWN.x).toBe(0);
    expect(Vec2.DOWN.y).toBe(1);
    expect(Vec2.LEFT.x).toBe(-1);
    expect(Vec2.LEFT.y).toBe(0);
    expect(Vec2.RIGHT.x).toBe(1);
    expect(Vec2.RIGHT.y).toBe(0);
  });
});