import { describe, it, expect } from 'vitest';
import { SpatialGrid } from '../src/grid/SpatialGrid';

describe('SpatialGrid', () => {
  it('queries only objects in overlapping cells', () => {
    const grid = new SpatialGrid(100);
    grid.insert(1, { x: 0, y: 0, width: 10, height: 10 });
    grid.insert(2, { x: 500, y: 500, width: 10, height: 10 });
    expect(grid.query({ x: 0, y: 0, width: 50, height: 50 })).toEqual([1]);
    expect(grid.query({ x: 490, y: 490, width: 50, height: 50 })).toEqual([2]);
  });

  it('finds collision pairs for overlapping objects only', () => {
    const grid = new SpatialGrid(100);
    grid.insert(1, { x: 0, y: 0, width: 20, height: 20 });
    grid.insert(2, { x: 10, y: 10, width: 20, height: 20 });
    grid.insert(3, { x: 300, y: 300, width: 20, height: 20 });
    const pairs = grid.getCollisionPairs();
    expect(pairs.length).toBe(1);
    expect(pairs[0]).toEqual(expect.arrayContaining([1, 2]));
  });

  it('clear empties the grid', () => {
    const grid = new SpatialGrid(100);
    grid.insert(1, { x: 0, y: 0, width: 10, height: 10 });
    grid.clear();
    expect(grid.getStats().objects).toBe(0);
    expect(grid.query({ x: 0, y: 0, width: 50, height: 50 })).toEqual([]);
  });
});
