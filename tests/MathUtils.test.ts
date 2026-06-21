import { describe, it, expect } from 'vitest';
import { MathUtils } from '../src/engine/utils/MathUtils';

describe('MathUtils', () => {
  it('should clamp value', () => {
    expect(MathUtils.clamp(5, 0, 10)).toBe(5);
    expect(MathUtils.clamp(-5, 0, 10)).toBe(0);
    expect(MathUtils.clamp(15, 0, 10)).toBe(10);
  });

  it('should lerp', () => {
    expect(MathUtils.lerp(0, 10, 0)).toBe(0);
    expect(MathUtils.lerp(0, 10, 1)).toBe(10);
    expect(MathUtils.lerp(0, 10, 0.5)).toBe(5);
    expect(MathUtils.lerp(10, 20, 0.3)).toBeCloseTo(13);
  });

  it('should convert degrees to radians', () => {
    expect(MathUtils.degToRad(0)).toBe(0);
    expect(MathUtils.degToRad(180)).toBeCloseTo(Math.PI);
    expect(MathUtils.degToRad(90)).toBeCloseTo(Math.PI / 2);
  });

  it('should convert radians to degrees', () => {
    expect(MathUtils.radToDeg(0)).toBe(0);
    expect(MathUtils.radToDeg(Math.PI)).toBeCloseTo(180);
    expect(MathUtils.radToDeg(Math.PI / 2)).toBeCloseTo(90);
  });

  it('should generate random int in range', () => {
    for (let i = 0; i < 100; i++) {
      const value = MathUtils.randomInt(1, 6);
      expect(value).toBeGreaterThanOrEqual(1);
      expect(value).toBeLessThanOrEqual(6);
      expect(Number.isInteger(value)).toBe(true);
    }
  });

  it('should generate random float in range', () => {
    for (let i = 0; i < 100; i++) {
      const value = MathUtils.randomFloat(0, 1);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('should check approximately equal', () => {
    expect(MathUtils.approximately(1, 1)).toBe(true);
    expect(MathUtils.approximately(1, 1.0000001)).toBe(true);
    expect(MathUtils.approximately(1, 2)).toBe(false);
    expect(MathUtils.approximately(1, 1.1, 0.2)).toBe(true);
  });

  it('should calculate distance', () => {
    expect(MathUtils.distance(0, 0, 3, 4)).toBe(5);
    expect(MathUtils.distance(0, 0, 0, 0)).toBe(0);
    expect(MathUtils.distance(1, 1, 4, 5)).toBe(5);
  });

  it('should calculate angle', () => {
    expect(MathUtils.angle(0, 0, 1, 0)).toBe(0);
    expect(MathUtils.angle(0, 0, 0, 1)).toBeCloseTo(Math.PI / 2);
    expect(MathUtils.angle(0, 0, -1, 0)).toBeCloseTo(Math.PI);
  });

  it('should check power of two', () => {
    expect(MathUtils.isPowerOfTwo(1)).toBe(true);
    expect(MathUtils.isPowerOfTwo(2)).toBe(true);
    expect(MathUtils.isPowerOfTwo(4)).toBe(true);
    expect(MathUtils.isPowerOfTwo(3)).toBe(false);
    expect(MathUtils.isPowerOfTwo(0)).toBe(false);
  });

  it('should get next power of two', () => {
    expect(MathUtils.nextPowerOfTwo(1)).toBe(1);
    expect(MathUtils.nextPowerOfTwo(2)).toBe(2);
    expect(MathUtils.nextPowerOfTwo(3)).toBe(4);
    expect(MathUtils.nextPowerOfTwo(5)).toBe(8);
    expect(MathUtils.nextPowerOfTwo(9)).toBe(16);
  });
});