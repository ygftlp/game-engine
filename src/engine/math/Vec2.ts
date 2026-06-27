// 二维向量，用于位置、缩放等变换计算。
export class Vec2 {
  constructor(public x: number = 0, public y: number = 0) {}

  set(x: number, y: number): this {
    this.x = x;
    this.y = y;
    return this;
  }

  clone(): Vec2 {
    return new Vec2(this.x, this.y);
  }

  add(v: Vec2): Vec2 {
    return new Vec2(this.x + v.x, this.y + v.y);
  }

  sub(v: Vec2): Vec2 {
    return new Vec2(this.x - v.x, this.y - v.y);
  }

  subtract(v: Vec2): Vec2 {
    return this.sub(v);
  }

  scale(s: number): Vec2 {
    return new Vec2(this.x * s, this.y * s);
  }

  dot(v: Vec2): number {
    return this.x * v.x + this.y * v.y;
  }

  length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  lengthSquared(): number {
    return this.x * this.x + this.y * this.y;
  }

  lengthSq(): number {
    return this.lengthSquared();
  }

  normalize(): Vec2 {
    const len = this.length();
    if (len === 0) return new Vec2();
    return this.scale(1 / len);
  }

  lerp(v: Vec2, t: number): Vec2 {
    return new Vec2(
      this.x + (v.x - this.x) * t,
      this.y + (v.y - this.y) * t
    );
  }

  distance(v: Vec2): number {
    return this.sub(v).length();
  }

  distanceSquared(v: Vec2): number {
    return this.sub(v).lengthSquared();
  }

  distanceTo(v: Vec2): number {
    return this.distance(v);
  }

  distanceToSq(v: Vec2): number {
    return this.distanceSquared(v);
  }

  angle(): number {
    return Math.atan2(this.y, this.x);
  }

  rotate(angle: number): Vec2 {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return new Vec2(
      this.x * c - this.y * s,
      this.x * s + this.y * c
    );
  }

  perpendicular(): Vec2 {
    return new Vec2(-this.y, this.x);
  }

  negate(): Vec2 {
    return new Vec2(-this.x, -this.y);
  }

  equals(v: Vec2, epsilon?: number): boolean {
    if (epsilon !== undefined) {
      return Math.abs(this.x - v.x) <= epsilon && Math.abs(this.y - v.y) <= epsilon;
    }
    return this.x === v.x && this.y === v.y;
  }

  toString(): string {
    return `Vec2(${this.x}, ${this.y})`;
  }

  static fromAngle(angle: number): Vec2 {
    return new Vec2(Math.cos(angle), Math.sin(angle));
  }

  static distance(a: Vec2, b: Vec2): number {
    return a.distanceTo(b);
  }

  static lerp(a: Vec2, b: Vec2, t: number): Vec2 {
    return a.lerp(b, t);
  }

  static readonly ZERO = new Vec2(0, 0);
  static readonly ONE = new Vec2(1, 1);
  static readonly UP = new Vec2(0, -1);
  static readonly DOWN = new Vec2(0, 1);
  static readonly LEFT = new Vec2(-1, 0);
  static readonly RIGHT = new Vec2(1, 0);
}
