// 空间网格：用于BroadPhase碰撞检测优化，将O(n^2)降低到O(n)。
import { Rect } from '../collision/Collision';

export class SpatialGrid {
  private cellSize: number;
  private grid = new Map<string, Set<number>>();
  private objects: Array<{ id: number; rect: Rect }> = [];

  constructor(cellSize: number = 100) {
    this.cellSize = cellSize;
  }

  /** 清空网格 */
  clear(): void {
    this.grid.clear();
    this.objects.length = 0;
  }

  /** 添加物体 */
  insert(id: number, rect: Rect): void {
    this.objects.push({ id, rect });
    const cells = this.getCells(rect);
    for (const cell of cells) {
      let set = this.grid.get(cell);
      if (!set) {
        set = new Set();
        this.grid.set(cell, set);
      }
      set.add(id);
    }
  }

  /** 获取可能碰撞的物体ID列表（排除自身） */
  query(rect: Rect, excludeId?: number): number[] {
    const result = new Set<number>();
    const cells = this.getCells(rect);
    for (const cell of cells) {
      const set = this.grid.get(cell);
      if (set) {
        for (const id of set) {
          if (id !== excludeId) {
            result.add(id);
          }
        }
      }
    }
    return Array.from(result);
  }

  /** 获取物体所在的网格单元 */
  private getCells(rect: Rect): string[] {
    const cells: string[] = [];
    const startX = Math.floor(rect.x / this.cellSize);
    const startY = Math.floor(rect.y / this.cellSize);
    const endX = Math.floor((rect.x + rect.width) / this.cellSize);
    const endY = Math.floor((rect.y + rect.height) / this.cellSize);

    for (let x = startX; x <= endX; x++) {
      for (let y = startY; y <= endY; y++) {
        cells.push(`${x},${y}`);
      }
    }
    return cells;
  }

  /** 获取所有碰撞对 */
  getCollisionPairs(): Array<[number, number]> {
    const pairs: Array<[number, number]> = [];
    const checked = new Set<string>();

    for (const set of this.grid.values()) {
      const ids = Array.from(set);
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          const key = `${Math.min(ids[i], ids[j])}-${Math.max(ids[i], ids[j])}`;
          if (!checked.has(key)) {
            checked.add(key);
            pairs.push([ids[i], ids[j]]);
          }
        }
      }
    }
    return pairs;
  }

  /** 获取网格统计信息 */
  getStats(): { cells: number; objects: number; avgObjectsPerCell: number } {
    let totalObjects = 0;
    for (const set of this.grid.values()) {
      totalObjects += set.size;
    }
    return {
      cells: this.grid.size,
      objects: this.objects.length,
      avgObjectsPerCell: this.grid.size > 0 ? totalObjects / this.grid.size : 0
    };
  }
}
