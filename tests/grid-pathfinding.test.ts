import { describe, it, expect } from 'vitest';
import { GridPathfinder } from '../src/grid/Pathfinding';

describe('GridPathfinder', () => {
  it('finds a straight path on an open grid (no diagonal)', () => {
    const pf = new GridPathfinder(5, 5, { allowDiagonal: false });
    const res = pf.findPath(0, 0, 4, 0);
    expect(res.found).toBe(true);
    expect(res.path.length).toBe(5);
    expect(res.path[0]).toMatchObject({ x: 0, y: 0 });
    expect(res.path[4]).toMatchObject({ x: 4, y: 0 });
  });

  it('routes around a wall through the only gap', () => {
    const pf = new GridPathfinder(5, 5, { allowDiagonal: false });
    for (let y = 0; y < 4; y++) pf.setWalkable(2, y, false); // wall column, gap at y=4
    const res = pf.findPath(0, 0, 4, 0);
    expect(res.found).toBe(true);
    expect(res.path.some((p) => p.x === 2 && p.y === 4)).toBe(true);
    for (const p of res.path) expect(pf.isWalkable(p.x, p.y)).toBe(true);
  });

  it('reports not found when the target is sealed off', () => {
    const pf = new GridPathfinder(5, 5, { allowDiagonal: false });
    for (let y = 0; y < 5; y++) pf.setWalkable(2, y, false);
    const res = pf.findPath(0, 0, 4, 0);
    expect(res.found).toBe(false);
    expect(res.path).toEqual([]);
  });

  it('reports not found when an endpoint is blocked', () => {
    const pf = new GridPathfinder(3, 3);
    pf.setWalkable(2, 2, false);
    expect(pf.findPath(0, 0, 2, 2).found).toBe(false);
  });

  // Regression (FlashOut panel round 3 P0): a caller passed a goal
  // built from undefined fields, worldToCell produced NaN cells, and
  // isWalkable(NaN, NaN) fell through its bounds check (all NaN
  // comparisons are false) into grid[NaN][NaN], throwing a TypeError
  // that killed the game's main loop. Non-integer input must fail
  // closed: not walkable, no path, never a throw.
  it('fails closed on non-integer coordinates instead of throwing', () => {
    const pf = new GridPathfinder(5, 5, { allowDiagonal: false });
    expect(pf.isWalkable(NaN, NaN)).toBe(false);
    expect(pf.isWalkable(1.5, 2)).toBe(false);
    expect(pf.isWalkable(undefined as unknown as number, 0)).toBe(false);
    expect(() => pf.findPath(0, 0, NaN, NaN)).not.toThrow();
    expect(pf.findPath(0, 0, NaN, NaN).found).toBe(false);
    expect(pf.findPath(NaN, 0, 4, 4).found).toBe(false);
    expect(() => pf.setWalkable(NaN, NaN, false)).not.toThrow();
    expect(pf.findPath(0, 0, 4, 0).found).toBe(true); // grid untouched
  });
});
