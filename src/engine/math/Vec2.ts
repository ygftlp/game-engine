// 二维向量，用于位置、缩放等变换计算。
export class Vec2 {
  constructor(public x: number = 0, public y: number = 0) {}

  set(x: number, y: number): this {
    this.x = x;
    this.y = y;
    return this;
  }

  add(v: Vec2): Vec2 {
    return new Vec2(this.x + v.x, this.y + v.y);
  }

  clone(): Vec2 {
    return new Vec2(this.x, this.y);
  }
}
