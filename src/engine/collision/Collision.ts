// 碰撞检测：轻量 AABB 矩形与圆形碰撞。
import { SpatialGrid } from './SpatialGrid';
import { Logger } from '../utils/Logger';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Circle {
  x: number;
  y: number;
  radius: number;
}

export class Collision {
  private static grid: SpatialGrid | null = null;

  static rectIntersect(a: Rect, b: Rect): boolean {
    if (isNaN(a.x) || isNaN(a.y) || isNaN(a.width) || isNaN(a.height) ||
        isNaN(b.x) || isNaN(b.y) || isNaN(b.width) || isNaN(b.height)) {
      Logger.forModule('Physics').warning('rectIntersect received invalid rect');
      return false;
    }
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  static circleIntersect(a: Circle, b: Circle): boolean {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const r = a.radius + b.radius;
    return dx * dx + dy * dy <= r * r;
  }

  static pointInRect(px: number, py: number, r: Rect): boolean {
    return px >= r.x && px <= r.x + r.width && py >= r.y && py <= r.y + r.height;
  }

  static initGrid(cellSize: number = 100): void {
    Collision.grid = new SpatialGrid(cellSize);
  }

  static insertToGrid(id: number, rect: Rect): void {
    if (!Collision.grid) Collision.initGrid();
    Collision.grid!.insert(id, rect);
  }

  static queryGrid(rect: Rect, excludeId?: number): number[] {
    if (!Collision.grid) return [];
    return Collision.grid.query(rect, excludeId);
  }

  static getCollisionPairs(): Array<[number, number]> {
    if (!Collision.grid) return [];
    return Collision.grid.getCollisionPairs();
  }

  static clearGrid(): void {
    if (Collision.grid) Collision.grid.clear();
  }

  static getGridStats(): { cells: number; objects: number; avgObjectsPerCell: number } | null {
    if (!Collision.grid) return null;
    return Collision.grid.getStats();
  }
}
