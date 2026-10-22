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
});
