// 碰撞检测：轻量 AABB 矩形与圆形碰撞。

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
  static rectIntersect(a: Rect, b: Rect): boolean {
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
}
