// A* 寻路：支持网格/图寻路、对角线移动、动态障碍物。

import { Vec2 } from '../math/Vec2';

/** 网格节点 */
interface GridNode {
  x: number;
  y: number;
  walkable: boolean;
  g: number; // 从起点到此节点的成本
  h: number; // 从此节点到终点的启发式估计
  f: number; // g + h
  parent: GridNode | null;
  closed: boolean;
  opened: boolean;
}

/** 寻路结果 */
export interface PathResult {
  /** 是否找到路径 */
  found: boolean;
  /** 路径点列表 */
  path: Vec2[];
  /** 探索的节点数 */
  explored: number;
  /** 耗时（毫秒） */
  time: number;
}

/** 寻路配置 */
export interface PathfindingConfig {
  /** 是否允许对角线移动 */
  allowDiagonal?: boolean;
  /** 对角线移动代价 */
  diagonalCost?: number;
  /** 直线移动代价 */
  straightCost?: number;
  /** 启发式函数 */
  heuristic?: (a: { x: number; y: number }, b: { x: number; y: number }) => number;
}

const DEFAULT_CONFIG: Required<PathfindingConfig> = {
  allowDiagonal: true,
  diagonalCost: 1.414,
  straightCost: 1,
  heuristic: (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y),
};

/** 最小二叉堆（基于 f 值排序） */
class MinHeap {
  private data: GridNode[] = [];

  get length(): number {
    return this.data.length;
  }

  push(node: GridNode): void {
    this.data.push(node);
    this.bubbleUp(this.data.length - 1);
  }

  pop(): GridNode | undefined {
    if (this.data.length === 0) return undefined;
    const top = this.data[0];
    const last = this.data.pop()!;
    if (this.data.length > 0) {
      this.data[0] = last;
      this.sinkDown(0);
    }
    return top;
  }

  /** 更新节点的 f 值后调用以恢复堆性质 */
  resync(node: GridNode): void {
    const idx = this.data.indexOf(node);
    if (idx >= 0) {
      this.bubbleUp(idx);
    }
  }

  private bubbleUp(idx: number): void {
    while (idx > 0) {
      const parent = (idx - 1) >> 1;
      if (this.data[idx].f < this.data[parent].f) {
        [this.data[idx], this.data[parent]] = [this.data[parent], this.data[idx]];
        idx = parent;
      } else {
        break;
      }
    }
  }

  private sinkDown(idx: number): void {
    const len = this.data.length;
    while (true) {
      const left = 2 * idx + 1;
      const right = 2 * idx + 2;
      let smallest = idx;

      if (left < len && this.data[left].f < this.data[smallest].f) {
        smallest = left;
      }
      if (right < len && this.data[right].f < this.data[smallest].f) {
        smallest = right;
      }
      if (smallest !== idx) {
        [this.data[idx], this.data[smallest]] = [this.data[smallest], this.data[idx]];
        idx = smallest;
      } else {
        break;
      }
    }
  }
}

/**
 * 网格寻路器
 */
export class GridPathfinder {
  private grid: boolean[][];
  private width: number;
  private height: number;
  private config: Required<PathfindingConfig>;

  constructor(width: number, height: number, config?: PathfindingConfig) {
    this.width = width;
    this.height = height;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.grid = Array.from({ length: height }, () => Array(width).fill(true));
  }

  /** 设置网格 */
  setGrid(grid: boolean[][]): void {
    this.grid = grid;
    this.height = grid.length;
    this.width = grid[0]?.length ?? 0;
  }

  /** 设置节点可行走状态 */
  setWalkable(x: number, y: number, walkable: boolean): void {
    if (y >= 0 && y < this.height && x >= 0 && x < this.width) {
      this.grid[y][x] = walkable;
    }
  }

  /** 获取节点可行走状态 */
  isWalkable(x: number, y: number): boolean {
    if (y < 0 || y >= this.height || x < 0 || x >= this.width) return false;
    return this.grid[y][x];
  }

  /** A* 寻路 */
  findPath(startX: number, startY: number, endX: number, endY: number): PathResult {
    const startTime = performance.now();

    // 验证输入
    if (!this.isWalkable(startX, startY) || !this.isWalkable(endX, endY)) {
      return { found: false, path: [], explored: 0, time: 0 };
    }

    // 初始化节点
    const nodes: GridNode[][] = Array.from({ length: this.height }, (_, y) =>
      Array.from({ length: this.width }, (_, x) => ({
        x, y,
        walkable: this.grid[y][x],
        g: Infinity,
        h: 0,
        f: Infinity,
        parent: null,
        closed: false,
        opened: false,
      }))
    );

    const startNode = nodes[startY][startX];
    const endNode = nodes[endY][endX];

    // 起点初始化
    startNode.g = 0;
    startNode.h = this.config.heuristic(startNode, endNode);
    startNode.f = startNode.h;

    // 开放列表（二叉堆优先队列）
    const openList = new MinHeap();
    openList.push(startNode);
    startNode.opened = true;

    let explored = 0;

    // 方向偏移
    const directions = [
      { dx: 0, dy: -1, cost: this.config.straightCost },  // 上
      { dx: 1, dy: 0, cost: this.config.straightCost },   // 右
      { dx: 0, dy: 1, cost: this.config.straightCost },   // 下
      { dx: -1, dy: 0, cost: this.config.straightCost },  // 左
    ];

    if (this.config.allowDiagonal) {
      directions.push(
        { dx: 1, dy: -1, cost: this.config.diagonalCost },  // 右上
        { dx: 1, dy: 1, cost: this.config.diagonalCost },   // 右下
        { dx: -1, dy: 1, cost: this.config.diagonalCost },  // 左下
        { dx: -1, dy: -1, cost: this.config.diagonalCost }, // 左上
      );
    }

    while (openList.length > 0) {
      const current = openList.pop()!;
      explored++;

      // 找到终点
      if (current === endNode) {
        const path = this.reconstructPath(endNode);
        return {
          found: true,
          path,
          explored,
          time: performance.now() - startTime,
        };
      }

      current.closed = true;

      // 遍历邻居
      for (const dir of directions) {
        const nx = current.x + dir.dx;
        const ny = current.y + dir.dy;

        if (nx < 0 || nx >= this.width || ny < 0 || ny >= this.height) continue;

        const neighbor = nodes[ny][nx];
        if (!neighbor.walkable || neighbor.closed) continue;

        // 对角线移动时检查是否被阻挡
        if (dir.dx !== 0 && dir.dy !== 0) {
          if (!this.isWalkable(current.x + dir.dx, current.y) ||
              !this.isWalkable(current.x, current.y + dir.dy)) {
            continue;
          }
        }

        const tentativeG = current.g + dir.cost;

        if (!neighbor.opened || tentativeG < neighbor.g) {
          neighbor.g = tentativeG;
          neighbor.h = this.config.heuristic(neighbor, endNode);
          neighbor.f = neighbor.g + neighbor.h;
          neighbor.parent = current;

          if (!neighbor.opened) {
            neighbor.opened = true;
            openList.push(neighbor);
          } else {
            openList.resync(neighbor);
          }
        }
      }
    }

    // 无路径
    return { found: false, path: [], explored, time: performance.now() - startTime };
  }

  /** 重构路径 */
  private reconstructPath(node: GridNode): Vec2[] {
    const path: Vec2[] = [];
    let current: GridNode | null = node;

    while (current) {
      path.unshift(new Vec2(current.x, current.y));
      current = current.parent;
    }

    return path;
  }

  /** 路径平滑（简化路径点） */
  static smoothPath(path: Vec2[], maxError = 0.5): Vec2[] {
    if (path.length <= 2) return path;

    const smoothed: Vec2[] = [path[0]];
    let current = 0;

    while (current < path.length - 1) {
      let farthest = current + 1;

      for (let i = path.length - 1; i > current + 1; i--) {
        const dx = path[i].x - path[current].x;
        const dy = path[i].y - path[current].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // 检查中间点是否偏离直线
        let maxDeviation = 0;
        for (let j = current + 1; j < i; j++) {
          const t = ((path[j].x - path[current].x) * dx + (path[j].y - path[current].y) * dy) / (dist * dist);
          const projX = path[current].x + t * dx;
          const projY = path[current].y + t * dy;
          const deviation = Math.sqrt(
            (path[j].x - projX) ** 2 + (path[j].y - projY) ** 2
          );
          maxDeviation = Math.max(maxDeviation, deviation);
        }

        if (maxDeviation <= maxError) {
          farthest = i;
        }
      }

      smoothed.push(path[farthest]);
      current = farthest;
    }

    return smoothed;
  }

  /** 获取网格统计 */
  getStats(): { width: number; height: number; walkable: number; blocked: number } {
    let walkable = 0;
    let blocked = 0;
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.grid[y][x]) walkable++;
        else blocked++;
      }
    }
    return { width: this.width, height: this.height, walkable, blocked };
  }
}

// ========== 导航网格（简化版） ==========

/** 导航网格三角形 */
export interface NavTriangle {
  id: number;
  vertices: [Vec2, Vec2, Vec2];
  neighbors: number[];
  /** 预计算的中心点 */
  center: Vec2;
}

/**
 * 导航网格寻路器（简化版）
 */
export class NavMeshPathfinder {
  private triangles: NavTriangle[] = [];

  /** 添加三角形 */
  addTriangle(triangle: NavTriangle): void {
    this.triangles.push(triangle);
  }

  /** 获取三角形列表 */
  getTriangles(): readonly NavTriangle[] {
    return this.triangles;
  }

  /** 查找点所在的三角形 */
  findTriangle(point: Vec2): NavTriangle | null {
    for (const tri of this.triangles) {
      if (this.pointInTriangle(point, tri.vertices)) {
        return tri;
      }
    }
    return null;
  }

  /** A* 寻路（在三角形图上） */
  findPath(start: Vec2, end: Vec2): Vec2[] {
    const startTri = this.findTriangle(start);
    const endTri = this.findTriangle(end);

    if (!startTri || !endTri) return [];

    if (startTri === endTri) {
      return [start, end];
    }

    // A* 在三角形图上
    const openList: NavTriangle[] = [startTri];
    const cameFrom = new Map<number, number>();
    const gScore = new Map<number, number>();
    const fScore = new Map<number, number>();

    gScore.set(startTri.id, 0);
    fScore.set(startTri.id, this.heuristic(startTri.center, endTri.center));

    const closedSet = new Set<number>();

    while (openList.length > 0) {
      // 找到 f 值最小的
      openList.sort((a, b) => (fScore.get(a.id) ?? Infinity) - (fScore.get(b.id) ?? Infinity));
      const current = openList.shift()!;

      if (current === endTri) {
        return this.reconstructNavPath(cameFrom, current, start, end);
      }

      closedSet.add(current.id);

      for (const neighborId of current.neighbors) {
        if (closedSet.has(neighborId)) continue;

        const neighbor = this.triangles.find(t => t.id === neighborId);
        if (!neighbor) continue;

        const tentativeG = (gScore.get(current.id) ?? 0) + this.heuristic(current.center, neighbor.center);

        if (!openList.includes(neighbor) || tentativeG < (gScore.get(neighbor.id) ?? Infinity)) {
          cameFrom.set(neighbor.id, current.id);
          gScore.set(neighbor.id, tentativeG);
          fScore.set(neighbor.id, tentativeG + this.heuristic(neighbor.center, endTri.center));

          if (!openList.includes(neighbor)) {
            openList.push(neighbor);
          }
        }
      }
    }

    return [];
  }

  private pointInTriangle(p: Vec2, triangle: [Vec2, Vec2, Vec2]): boolean {
    const [a, b, c] = triangle;
    const d1 = this.sign(p, a, b);
    const d2 = this.sign(p, b, c);
    const d3 = this.sign(p, c, a);

    const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0);
    const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0);

    return !(hasNeg && hasPos);
  }

  private sign(p: Vec2, a: Vec2, b: Vec2): number {
    return (p.x - b.x) * (a.y - b.y) - (a.x - b.x) * (p.y - b.y);
  }

  private heuristic(a: Vec2, b: Vec2): number {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  private reconstructNavPath(cameFrom: Map<number, number>, current: NavTriangle, start: Vec2, end: Vec2): Vec2[] {
    const path: Vec2[] = [end];
    let tri: NavTriangle | undefined = current;

    while (tri && cameFrom.has(tri.id)) {
      path.unshift(tri.center);
      const parentId = cameFrom.get(tri.id);
      tri = this.triangles.find(t => t.id === parentId);
    }

    path.unshift(start);
    return path;
  }
}
