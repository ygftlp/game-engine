import { describe, it, expect } from 'vitest';
import { Collision, Rect, Circle } from '../src/engine/collision/Collision';

describe('Collision', () => {
  describe('rectIntersect', () => {
    it('should detect intersecting rectangles', () => {
      const a: Rect = { x: 0, y: 0, width: 10, height: 10 };
      const b: Rect = { x: 5, y: 5, width: 10, height: 10 };
      expect(Collision.rectIntersect(a, b)).toBe(true);
      expect(Collision.rectIntersect(b, a)).toBe(true);
    });

    it('should detect non-intersecting rectangles', () => {
      const a: Rect = { x: 0, y: 0, width: 10, height: 10 };
      const b: Rect = { x: 20, y: 20, width: 10, height: 10 };
      expect(Collision.rectIntersect(a, b)).toBe(false);
      expect(Collision.rectIntersect(b, a)).toBe(false);
    });

    it('should detect edge-touching rectangles as non-intersecting', () => {
      const a: Rect = { x: 0, y: 0, width: 10, height: 10 };
      const b: Rect = { x: 10, y: 0, width: 10, height: 10 };
      expect(Collision.rectIntersect(a, b)).toBe(false);
    });

    it('should detect contained rectangles', () => {
      const a: Rect = { x: 0, y: 0, width: 10, height: 10 };
      const b: Rect = { x: 2, y: 2, width: 5, height: 5 };
      expect(Collision.rectIntersect(a, b)).toBe(true);
      expect(Collision.rectIntersect(b, a)).toBe(true);
    });
  });

  describe('circleIntersect', () => {
    it('should detect intersecting circles', () => {
      const a: Circle = { x: 0, y: 0, radius: 5 };
      const b: Circle = { x: 8, y: 0, radius: 5 };
      expect(Collision.circleIntersect(a, b)).toBe(true);
      expect(Collision.circleIntersect(b, a)).toBe(true);
    });

    it('should detect non-intersecting circles', () => {
      const a: Circle = { x: 0, y: 0, radius: 5 };
      const b: Circle = { x: 20, y: 0, radius: 5 };
      expect(Collision.circleIntersect(a, b)).toBe(false);
      expect(Collision.circleIntersect(b, a)).toBe(false);
    });

    it('should detect tangent circles as intersecting', () => {
      const a: Circle = { x: 0, y: 0, radius: 5 };
      const b: Circle = { x: 10, y: 0, radius: 5 };
      expect(Collision.circleIntersect(a, b)).toBe(true);
    });

    it('should detect contained circles', () => {
      const a: Circle = { x: 0, y: 0, radius: 10 };
      const b: Circle = { x: 0, y: 0, radius: 5 };
      expect(Collision.circleIntersect(a, b)).toBe(true);
    });

    it('should detect same position circles', () => {
      const a: Circle = { x: 5, y: 5, radius: 3 };
      const b: Circle = { x: 5, y: 5, radius: 3 };
      expect(Collision.circleIntersect(a, b)).toBe(true);
    });
  });

  describe('pointInRect', () => {
    it('should detect point inside rectangle', () => {
      const r: Rect = { x: 0, y: 0, width: 10, height: 10 };
      expect(Collision.pointInRect(5, 5, r)).toBe(true);
    });

    it('should detect point outside rectangle', () => {
      const r: Rect = { x: 0, y: 0, width: 10, height: 10 };
      expect(Collision.pointInRect(15, 15, r)).toBe(false);
    });

    it('should detect point on edge', () => {
      const r: Rect = { x: 0, y: 0, width: 10, height: 10 };
      expect(Collision.pointInRect(0, 0, r)).toBe(true);
      expect(Collision.pointInRect(10, 10, r)).toBe(true);
    });

    it('should detect point on corner', () => {
      const r: Rect = { x: 0, y: 0, width: 10, height: 10 };
      expect(Collision.pointInRect(0, 10, r)).toBe(true);
      expect(Collision.pointInRect(10, 0, r)).toBe(true);
    });
  });
});