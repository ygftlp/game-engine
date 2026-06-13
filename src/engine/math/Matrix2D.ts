// 2D 仿射变换矩阵（a c e / b d f / 0 0 1），用于世界坐标换算与命中检测。
export class Matrix2D {
  constructor(
    public a = 1,
    public b = 0,
    public c = 0,
    public d = 1,
    public e = 0,
    public f = 0
  ) {}

  identity(): this {
    this.a = 1;
    this.b = 0;
    this.c = 0;
    this.d = 1;
    this.e = 0;
    this.f = 0;
    return this;
  }

  /** 在当前矩阵基础上依次应用平移、旋转、缩放（与渲染顺序一致）。 */
  applyTransform(x: number, y: number, rotation: number, scaleX: number, scaleY: number): this {
    // 平移
    this.e += this.a * x + this.c * y;
    this.f += this.b * x + this.d * y;
    // 旋转
    if (rotation !== 0) {
      const cos = Math.cos(rotation);
      const sin = Math.sin(rotation);
      const a = this.a;
      const b = this.b;
      const c = this.c;
      const d = this.d;
      this.a = a * cos + c * sin;
      this.b = b * cos + d * sin;
      this.c = a * -sin + c * cos;
      this.d = b * -sin + d * cos;
    }
    // 缩放
    if (scaleX !== 1 || scaleY !== 1) {
      this.a *= scaleX;
      this.b *= scaleX;
      this.c *= scaleY;
      this.d *= scaleY;
    }
    return this;
  }

  clone(): Matrix2D {
    return new Matrix2D(this.a, this.b, this.c, this.d, this.e, this.f);
  }

  /** 将世界坐标反变换为本矩阵的局部坐标。 */
  invertPoint(x: number, y: number): { x: number; y: number } {
    const det = this.a * this.d - this.b * this.c;
    if (det === 0) return { x: 0, y: 0 };
    const id = 1 / det;
    const dx = x - this.e;
    const dy = y - this.f;
    return {
      x: (dx * this.d - dy * this.c) * id,
      y: (dy * this.a - dx * this.b) * id
    };
  }
}
