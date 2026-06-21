import { describe, it, expect } from 'vitest';
import { Matrix2D } from '../src/engine/math/Matrix2D';

describe('Matrix2D', () => {
  it('should create identity matrix by default', () => {
    const m = new Matrix2D();
    expect(m.a).toBe(1);
    expect(m.b).toBe(0);
    expect(m.c).toBe(0);
    expect(m.d).toBe(1);
    expect(m.e).toBe(0);
    expect(m.f).toBe(0);
  });

  it('should create matrix with custom values', () => {
    const m = new Matrix2D(1, 2, 3, 4, 5, 6);
    expect(m.a).toBe(1);
    expect(m.b).toBe(2);
    expect(m.c).toBe(3);
    expect(m.d).toBe(4);
    expect(m.e).toBe(5);
    expect(m.f).toBe(6);
  });

  it('should reset to identity', () => {
    const m = new Matrix2D(1, 2, 3, 4, 5, 6);
    m.identity();
    expect(m.a).toBe(1);
    expect(m.b).toBe(0);
    expect(m.c).toBe(0);
    expect(m.d).toBe(1);
    expect(m.e).toBe(0);
    expect(m.f).toBe(0);
  });

  it('should apply translation', () => {
    const m = new Matrix2D();
    m.applyTransform(10, 20, 0, 1, 1);
    expect(m.e).toBe(10);
    expect(m.f).toBe(20);
    expect(m.a).toBe(1);
    expect(m.d).toBe(1);
  });

  it('should apply rotation', () => {
    const m = new Matrix2D();
    m.applyTransform(0, 0, Math.PI / 2, 1, 1);
    expect(m.a).toBeCloseTo(0);
    expect(m.b).toBeCloseTo(1);
    expect(m.c).toBeCloseTo(-1);
    expect(m.d).toBeCloseTo(0);
  });

  it('should apply scale', () => {
    const m = new Matrix2D();
    m.applyTransform(0, 0, 0, 2, 3);
    expect(m.a).toBe(2);
    expect(m.d).toBe(3);
    expect(m.b).toBe(0);
    expect(m.c).toBe(0);
  });

  it('should apply combined transform', () => {
    const m = new Matrix2D();
    m.applyTransform(10, 20, Math.PI / 4, 2, 2);
    // Matrix multiplication order: translate(10,20) * rotate(PI/4) * scale(2,2)
    // Start with identity [1,0,0,1,0,0]
    // After translate(10,20): [1,0,0,1,10,20]
    // After rotate(PI/4): cos=sin≈0.7071
    //   a = 1*0.7071 + 0*0.7071 = 0.7071
    //   b = 0*0.7071 + 1*0.7071 = 0.7071
    //   c = 1*-0.7071 + 0*0.7071 = -0.7071
    //   d = 0*-0.7071 + 1*0.7071 = 0.7071
    //   e = 10 (unchanged)
    //   f = 20 (unchanged)
    // After scale(2,2):
    //   a = 0.7071*2 = 1.4142
    //   b = 0.7071*2 = 1.4142
    //   c = -0.7071*2 = -1.4142
    //   d = 0.7071*2 = 1.4142
    //   e = 10 (unchanged)
    //   f = 20 (unchanged)
    expect(m.a).toBeCloseTo(1.4142, 3);
    expect(m.b).toBeCloseTo(1.4142, 3);
    expect(m.c).toBeCloseTo(-1.4142, 3);
    expect(m.d).toBeCloseTo(1.4142, 3);
    expect(m.e).toBeCloseTo(10, 2);
    expect(m.f).toBeCloseTo(20, 2);
  });

  it('should clone matrix', () => {
    const m = new Matrix2D(1, 2, 3, 4, 5, 6);
    const clone = m.clone();
    expect(clone.a).toBe(1);
    expect(clone.b).toBe(2);
    expect(clone.c).toBe(3);
    expect(clone.d).toBe(4);
    expect(clone.e).toBe(5);
    expect(clone.f).toBe(6);
    clone.a = 10;
    expect(m.a).toBe(1); // original unchanged
  });

  it('should invert point (identity)', () => {
    const m = new Matrix2D();
    const result = m.invertPoint(5, 10);
    expect(result.x).toBe(5);
    expect(result.y).toBe(10);
  });

  it('should invert point (translation only)', () => {
    const m = new Matrix2D();
    m.applyTransform(10, 20, 0, 1, 1);
    const result = m.invertPoint(15, 25);
    expect(result.x).toBeCloseTo(5);
    expect(result.y).toBeCloseTo(5);
  });

  it('should invert point (scale only)', () => {
    const m = new Matrix2D();
    m.applyTransform(0, 0, 0, 2, 3);
    const result = m.invertPoint(10, 15);
    expect(result.x).toBeCloseTo(5);
    expect(result.y).toBeCloseTo(5);
  });

  it('should invert point (singular matrix)', () => {
    const m = new Matrix2D(1, 2, 2, 4, 0, 0); // det = 1*4 - 2*2 = 0
    const result = m.invertPoint(5, 10);
    expect(result).toBeNull();
  });
});