// 3D 数学库：Vec3、Mat4、四元数，支持变换、投影、视图矩阵。

/** 3D 向量 */
export class Vec3 {
  constructor(
    public x = 0,
    public y = 0,
    public z = 0
  ) {}

  set(x: number, y: number, z: number): this {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }

  clone(): Vec3 {
    return new Vec3(this.x, this.y, this.z);
  }

  add(v: Vec3): Vec3 {
    return new Vec3(this.x + v.x, this.y + v.y, this.z + v.z);
  }

  sub(v: Vec3): Vec3 {
    return new Vec3(this.x - v.x, this.y - v.y, this.z - v.z);
  }

  scale(s: number): Vec3 {
    return new Vec3(this.x * s, this.y * s, this.z * s);
  }

  dot(v: Vec3): number {
    return this.x * v.x + this.y * v.y + this.z * v.z;
  }

  cross(v: Vec3): Vec3 {
    return new Vec3(
      this.y * v.z - this.z * v.y,
      this.z * v.x - this.x * v.z,
      this.x * v.y - this.y * v.x
    );
  }

  length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  lengthSq(): number {
    return this.x * this.x + this.y * this.y + this.z * this.z;
  }

  normalize(): Vec3 {
    const len = this.length();
    if (len === 0) return new Vec3();
    return this.scale(1 / len);
  }

  lerp(v: Vec3, t: number): Vec3 {
    return new Vec3(
      this.x + (v.x - this.x) * t,
      this.y + (v.y - this.y) * t,
      this.z + (v.z - this.z) * t
    );
  }

  distanceTo(v: Vec3): number {
    return this.sub(v).length();
  }

  toString(): string {
    return `Vec3(${this.x}, ${this.y}, ${this.z})`;
  }
}

/** 4x4 矩阵（列主序） */
export class Mat4 {
  /** 16 个元素，列主序 [m00,m01,m02,m03, m10,m11,m12,m13, m20,m21,m22,m23, m30,m31,m32,m33] */
  public data: Float32Array;

  constructor() {
    this.data = new Float32Array(16);
    this.identity();
  }

  /** 设置为单位矩阵 */
  identity(): this {
    this.data.fill(0);
    this.data[0] = this.data[5] = this.data[10] = this.data[15] = 1;
    return this;
  }

  /** 复制 */
  clone(): Mat4 {
    const m = new Mat4();
    m.data.set(this.data);
    return m;
  }

  /** 矩阵乘法 */
  multiply(other: Mat4): Mat4 {
    const result = new Mat4();
    const a = this.data;
    const b = other.data;
    const r = result.data;

    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        r[j * 4 + i] =
          a[i] * b[j * 4] +
          a[4 + i] * b[j * 4 + 1] +
          a[8 + i] * b[j * 4 + 2] +
          a[12 + i] * b[j * 4 + 3];
      }
    }

    return result;
  }

  /** 平移 */
  translate(x: number, y: number, z: number): this {
    const t = new Mat4();
    t.data[12] = x;
    t.data[13] = y;
    t.data[14] = z;
    const result = this.multiply(t);
    this.data.set(result.data);
    return this;
  }

  /** 缩放 */
  scale(x: number, y: number, z: number): this {
    const s = new Mat4();
    s.data[0] = x;
    s.data[5] = y;
    s.data[10] = z;
    const result = this.multiply(s);
    this.data.set(result.data);
    return this;
  }

  /** 旋转 X 轴 */
  rotateX(angle: number): this {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const r = new Mat4();
    r.data[5] = c;
    r.data[6] = s;
    r.data[9] = -s;
    r.data[10] = c;
    const result = this.multiply(r);
    this.data.set(result.data);
    return this;
  }

  /** 旋转 Y 轴 */
  rotateY(angle: number): this {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const r = new Mat4();
    r.data[0] = c;
    r.data[2] = -s;
    r.data[8] = s;
    r.data[10] = c;
    const result = this.multiply(r);
    this.data.set(result.data);
    return this;
  }

  /** 旋转 Z 轴 */
  rotateZ(angle: number): this {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const r = new Mat4();
    r.data[0] = c;
    r.data[1] = s;
    r.data[4] = -s;
    r.data[5] = c;
    const result = this.multiply(r);
    this.data.set(result.data);
    return this;
  }

  /** 转置 */
  transpose(): this {
    const d = this.data;
    [d[1], d[4]] = [d[4], d[1]];
    [d[2], d[8]] = [d[8], d[2]];
    [d[3], d[12]] = [d[12], d[3]];
    [d[6], d[9]] = [d[9], d[6]];
    [d[7], d[13]] = [d[13], d[7]];
    [d[11], d[14]] = [d[14], d[11]];
    return this;
  }

  /** 求逆 */
  invert(): Mat4 | null {
    const m = this.data;
    const inv = new Float32Array(16);

    inv[0] = m[5] * m[10] * m[15] - m[5] * m[11] * m[14] - m[9] * m[6] * m[15] +
      m[9] * m[7] * m[14] + m[13] * m[6] * m[11] - m[13] * m[7] * m[10];
    inv[4] = -m[4] * m[10] * m[15] + m[4] * m[11] * m[14] + m[8] * m[6] * m[15] -
      m[8] * m[7] * m[14] - m[12] * m[6] * m[11] + m[12] * m[7] * m[10];
    inv[8] = m[4] * m[9] * m[15] - m[4] * m[11] * m[13] - m[8] * m[5] * m[15] +
      m[8] * m[7] * m[13] + m[12] * m[5] * m[11] - m[12] * m[7] * m[9];
    inv[12] = -m[4] * m[9] * m[14] + m[4] * m[10] * m[13] + m[8] * m[5] * m[14] -
      m[8] * m[6] * m[13] - m[12] * m[5] * m[10] + m[12] * m[6] * m[9];
    inv[1] = -m[1] * m[10] * m[15] + m[1] * m[11] * m[14] + m[9] * m[2] * m[15] -
      m[9] * m[3] * m[14] - m[13] * m[2] * m[11] + m[13] * m[3] * m[10];
    inv[5] = m[0] * m[10] * m[15] - m[0] * m[11] * m[14] - m[8] * m[2] * m[15] +
      m[8] * m[3] * m[14] + m[12] * m[2] * m[11] - m[12] * m[3] * m[10];
    inv[9] = -m[0] * m[9] * m[15] + m[0] * m[11] * m[13] + m[8] * m[1] * m[15] -
      m[8] * m[3] * m[13] - m[12] * m[1] * m[11] + m[12] * m[3] * m[9];
    inv[13] = m[0] * m[9] * m[14] - m[0] * m[10] * m[13] - m[8] * m[1] * m[14] +
      m[8] * m[2] * m[13] + m[12] * m[1] * m[10] - m[12] * m[2] * m[9];
    inv[2] = m[1] * m[6] * m[15] - m[1] * m[7] * m[14] - m[5] * m[2] * m[15] +
      m[5] * m[3] * m[14] + m[13] * m[2] * m[7] - m[13] * m[3] * m[6];
    inv[6] = -m[0] * m[6] * m[15] + m[0] * m[7] * m[14] + m[4] * m[2] * m[15] -
      m[4] * m[3] * m[14] - m[12] * m[2] * m[7] + m[12] * m[3] * m[6];
    inv[10] = m[0] * m[5] * m[15] - m[0] * m[7] * m[13] - m[4] * m[1] * m[15] +
      m[4] * m[3] * m[13] + m[12] * m[1] * m[7] - m[12] * m[3] * m[5];
    inv[14] = -m[0] * m[5] * m[14] + m[0] * m[6] * m[13] + m[4] * m[1] * m[14] -
      m[4] * m[2] * m[13] - m[12] * m[1] * m[6] + m[12] * m[2] * m[5];
    inv[3] = -m[1] * m[6] * m[11] + m[1] * m[7] * m[10] + m[5] * m[2] * m[11] -
      m[5] * m[3] * m[10] - m[9] * m[2] * m[7] + m[9] * m[3] * m[6];
    inv[7] = m[0] * m[6] * m[11] - m[0] * m[7] * m[10] - m[4] * m[2] * m[11] +
      m[4] * m[3] * m[10] + m[8] * m[2] * m[7] - m[8] * m[3] * m[6];
    inv[11] = -m[0] * m[5] * m[11] + m[0] * m[7] * m[9] + m[4] * m[1] * m[11] -
      m[4] * m[3] * m[9] - m[8] * m[1] * m[7] + m[8] * m[3] * m[5];
    inv[15] = m[0] * m[5] * m[10] - m[0] * m[6] * m[9] - m[4] * m[1] * m[10] +
      m[4] * m[2] * m[9] + m[8] * m[1] * m[6] - m[8] * m[2] * m[5];

    let det = m[0] * inv[0] + m[1] * inv[4] + m[2] * inv[8] + m[3] * inv[12];
    if (Math.abs(det) < 1e-10) return null;

    det = 1 / det;
    const result = new Mat4();
    for (let i = 0; i < 16; i++) {
      result.data[i] = inv[i] * det;
    }
    return result;
  }

  /** 变换向量（仅旋转+平移） */
  transformPoint(v: Vec3): Vec3 {
    const d = this.data;
    const w = d[3] * v.x + d[7] * v.y + d[11] * v.z + d[15];
    return new Vec3(
      (d[0] * v.x + d[4] * v.y + d[8] * v.z + d[12]) / w,
      (d[1] * v.x + d[5] * v.y + d[9] * v.z + d[13]) / w,
      (d[2] * v.x + d[6] * v.y + d[10] * v.z + d[14]) / w
    );
  }

  /** 变换方向（仅旋转） */
  transformDirection(v: Vec3): Vec3 {
    const d = this.data;
    return new Vec3(
      d[0] * v.x + d[4] * v.y + d[8] * v.z,
      d[1] * v.x + d[5] * v.y + d[9] * v.z,
      d[2] * v.x + d[6] * v.y + d[10] * v.z
    );
  }

  /** 从列主序数组创建 */
  static fromArray(arr: number[] | Float32Array): Mat4 {
    const m = new Mat4();
    m.data.set(arr);
    return m;
  }

  /** 透视投影矩阵 */
  static perspective(fov: number, aspect: number, near: number, far: number): Mat4 {
    const m = new Mat4();
    m.data.fill(0);
    const f = 1 / Math.tan(fov / 2);
    m.data[0] = f / aspect;
    m.data[5] = f;
    m.data[10] = (far + near) / (near - far);
    m.data[11] = -1;
    m.data[14] = (2 * far * near) / (near - far);
    return m;
  }

  /** 正交投影矩阵 */
  static ortho(left: number, right: number, bottom: number, top: number, near: number, far: number): Mat4 {
    const m = new Mat4();
    m.data.fill(0);
    m.data[0] = 2 / (right - left);
    m.data[5] = 2 / (top - bottom);
    m.data[10] = -2 / (far - near);
    m.data[12] = -(right + left) / (right - left);
    m.data[13] = -(top + bottom) / (top - bottom);
    m.data[14] = -(far + near) / (far - near);
    m.data[15] = 1;
    return m;
  }

  /** LookAt 视图矩阵 */
  static lookAt(eye: Vec3, target: Vec3, up: Vec3): Mat4 {
    const z = eye.sub(target).normalize();
    const x = up.cross(z).normalize();
    const y = z.cross(x);

    const m = new Mat4();
    m.data[0] = x.x; m.data[4] = x.y; m.data[8] = x.z;  m.data[12] = -x.dot(eye);
    m.data[1] = y.x; m.data[5] = y.y; m.data[9] = y.z;  m.data[13] = -y.dot(eye);
    m.data[2] = z.x; m.data[6] = z.y; m.data[10] = z.z; m.data[14] = -z.dot(eye);
    m.data[3] = 0;   m.data[7] = 0;   m.data[11] = 0;   m.data[15] = 1;
    return m;
  }
}

/** 四元数 */
export class Quat {
  constructor(
    public x = 0,
    public y = 0,
    public z = 0,
    public w = 1
  ) {}

  clone(): Quat {
    return new Quat(this.x, this.y, this.z, this.w);
  }

  set(x: number, y: number, z: number, w: number): this {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
    return this;
  }

  /** 从轴角创建 */
  static fromAxisAngle(axis: Vec3, angle: number): Quat {
    const half = angle / 2;
    const s = Math.sin(half);
    const n = axis.normalize();
    return new Quat(n.x * s, n.y * s, n.z * s, Math.cos(half));
  }

  /** 从欧拉角创建 */
  static fromEuler(pitch: number, yaw: number, roll: number): Quat {
    const cp = Math.cos(pitch / 2);
    const sp = Math.sin(pitch / 2);
    const cy = Math.cos(yaw / 2);
    const sy = Math.sin(yaw / 2);
    const cr = Math.cos(roll / 2);
    const sr = Math.sin(roll / 2);

    return new Quat(
      sr * cp * cy - cr * sp * sy,
      cr * sp * cy + sr * cp * sy,
      cr * cp * sy - sr * sp * cy,
      cr * cp * cy + sr * sp * sy
    );
  }

  /** 四元数乘法 */
  multiply(q: Quat): Quat {
    return new Quat(
      this.w * q.x + this.x * q.w + this.y * q.z - this.z * q.y,
      this.w * q.y - this.x * q.z + this.y * q.w + this.z * q.x,
      this.w * q.z + this.x * q.y - this.y * q.x + this.z * q.w,
      this.w * q.w - this.x * q.x - this.y * q.y - this.z * q.z
    );
  }

  /** 归一化 */
  normalize(): Quat {
    const len = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
    if (len === 0) return new Quat();
    return new Quat(this.x / len, this.y / len, this.z / len, this.w / len);
  }

  /** 共轭 */
  conjugate(): Quat {
    return new Quat(-this.x, -this.y, -this.z, this.w);
  }

  /** 逆 */
  invert(): Quat {
    const lenSq = this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w;
    if (lenSq === 0) return new Quat();
    return this.conjugate().scale(1 / lenSq);
  }

  /** 标量乘法 */
  scale(s: number): Quat {
    return new Quat(this.x * s, this.y * s, this.z * s, this.w * s);
  }

  /** 转换为 Mat4 */
  toMat4(): Mat4 {
    const q = this.normalize();
    const { x, y, z, w } = q;

    const m = new Mat4();
    m.data[0] = 1 - 2 * (y * y + z * z);
    m.data[1] = 2 * (x * y + w * z);
    m.data[2] = 2 * (x * z - w * y);
    m.data[3] = 0;

    m.data[4] = 2 * (x * y - w * z);
    m.data[5] = 1 - 2 * (x * x + z * z);
    m.data[6] = 2 * (y * z + w * x);
    m.data[7] = 0;

    m.data[8] = 2 * (x * z + w * y);
    m.data[9] = 2 * (y * z - w * x);
    m.data[10] = 1 - 2 * (x * x + y * y);
    m.data[11] = 0;

    m.data[12] = 0;
    m.data[13] = 0;
    m.data[14] = 0;
    m.data[15] = 1;

    return m;
  }

  /** 球面线性插值 */
  slerp(q: Quat, t: number): Quat {
    let cosTheta = this.x * q.x + this.y * q.y + this.z * q.z + this.w * q.w;

    // 如果方向相反，取反
    if (cosTheta < 0) {
      q = new Quat(-q.x, -q.y, -q.z, -q.w);
      cosTheta = -cosTheta;
    }

    if (cosTheta > 0.9995) {
      // 线性插值
      return new Quat(
        this.x + (q.x - this.x) * t,
        this.y + (q.y - this.y) * t,
        this.z + (q.z - this.z) * t,
        this.w + (q.w - this.w) * t
      ).normalize();
    }

    const theta = Math.acos(cosTheta);
    const sinTheta = Math.sin(theta);
    const a = Math.sin((1 - t) * theta) / sinTheta;
    const b = Math.sin(t * theta) / sinTheta;

    return new Quat(
      this.x * a + q.x * b,
      this.y * a + q.y * b,
      this.z * a + q.z * b,
      this.w * a + q.w * b
    );
  }

  /** 将向量按四元数旋转 */
  rotateVector(v: Vec3): Vec3 {
    const qv = new Vec3(this.x, this.y, this.z);
    const uv = qv.cross(v);
    const uuv = qv.cross(uv);
    return v.add(uv.scale(2 * this.w)).add(uuv.scale(2));
  }
}
