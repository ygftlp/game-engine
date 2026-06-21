// 网格系统：支持顶点缓冲、索引缓冲、基本几何体生成、网格操作。
import { Vec3 } from '../math/Mat4';

/** 顶点数据布局 */
export interface VertexLayout {
  /** 位置 */
  position: boolean;
  /** 法线 */
  normal: boolean;
  /** UV 坐标 */
  uv: boolean;
  /** 切线 */
  tangent?: boolean;
  /** 颜色 */
  color?: boolean;
}

/** 网格数据 */
export interface MeshData {
  /** 顶点数据（交错布局） */
  vertices: Float32Array;
  /** 索引数据 */
  indices: Uint16Array;
  /** 顶点数量 */
  vertexCount: number;
  /** 索引数量 */
  indexCount: number;
  /** 顶点步长（float 数） */
  stride: number;
}

/**
 * 网格：3D 几何体。
 */
export class Mesh {
  name: string;
  vertices: Float32Array;
  indices: Uint16Array;
  vertexCount: number;
  indexCount: number;
  stride: number;
  layout: VertexLayout;

  /** 包围盒 */
  bounds = {
    min: new Vec3(Infinity, Infinity, Infinity),
    max: new Vec3(-Infinity, -Infinity, -Infinity),
  };

  constructor(data: MeshData, layout?: VertexLayout, name = 'mesh') {
    this.name = name;
    this.vertices = data.vertices;
    this.indices = data.indices;
    this.vertexCount = data.vertexCount;
    this.indexCount = data.indexCount;
    this.stride = data.stride;
    this.layout = layout ?? { position: true, normal: true, uv: true };
    this.calculateBounds();
  }

  /** 计算包围盒 */
  calculateBounds(): void {
    const posOffset = 0;
    this.bounds.min = new Vec3(Infinity, Infinity, Infinity);
    this.bounds.max = new Vec3(-Infinity, -Infinity, -Infinity);

    for (let i = 0; i < this.vertexCount; i++) {
      const x = this.vertices[i * this.stride + posOffset];
      const y = this.vertices[i * this.stride + posOffset + 1];
      const z = this.vertices[i * this.stride + posOffset + 2];

      this.bounds.min.x = Math.min(this.bounds.min.x, x);
      this.bounds.min.y = Math.min(this.bounds.min.y, y);
      this.bounds.min.z = Math.min(this.bounds.min.z, z);
      this.bounds.max.x = Math.max(this.bounds.max.x, x);
      this.bounds.max.y = Math.max(this.bounds.max.y, y);
      this.bounds.max.z = Math.max(this.bounds.max.z, z);
    }
  }

  /** 获取位置数据 */
  getPosition(index: number): Vec3 {
    const i = index * this.stride;
    return new Vec3(this.vertices[i], this.vertices[i + 1], this.vertices[i + 2]);
  }

  /** 获取法线数据 */
  getNormal(index: number): Vec3 {
    if (!this.layout.normal) return new Vec3(0, 1, 0);
    const offset = 3;
    const i = index * this.stride + offset;
    return new Vec3(this.vertices[i], this.vertices[i + 1], this.vertices[i + 2]);
  }

  /** 获取 UV 数据 */
  getUV(index: number): { u: number; v: number } {
    if (!this.layout.uv) return { u: 0, v: 0 };
    const offset = this.layout.normal ? 6 : 3;
    const i = index * this.stride + offset;
    return { u: this.vertices[i], v: this.vertices[i + 1] };
  }

  /** 克隆网格 */
  clone(): Mesh {
    return new Mesh({
      vertices: new Float32Array(this.vertices),
      indices: new Uint16Array(this.indices),
      vertexCount: this.vertexCount,
      indexCount: this.indexCount,
      stride: this.stride,
    }, { ...this.layout }, this.name + '_clone');
  }
}

// ========== 基本几何体 ==========

/** 创建平面网格 */
export function createPlaneMesh(width = 1, height = 1, segmentsW = 1, segmentsH = 1): Mesh {
  const vertices: number[] = [];
  const indices: number[] = [];
  const stride = 8; // pos(3) + normal(3) + uv(2)

  for (let j = 0; j <= segmentsH; j++) {
    for (let i = 0; i <= segmentsW; i++) {
      const x = (i / segmentsW - 0.5) * width;
      const z = (j / segmentsH - 0.5) * height;
      const u = i / segmentsW;
      const v = j / segmentsH;

      vertices.push(x, 0, z, 0, 1, 0, u, v);
    }
  }

  for (let j = 0; j < segmentsH; j++) {
    for (let i = 0; i < segmentsW; i++) {
      const a = j * (segmentsW + 1) + i;
      const b = a + 1;
      const c = a + segmentsW + 1;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  return new Mesh({
    vertices: new Float32Array(vertices),
    indices: new Uint16Array(indices),
    vertexCount: vertices.length / stride,
    indexCount: indices.length,
    stride,
  }, { position: true, normal: true, uv: true }, 'plane');
}

/** 创建立方体网格 */
export function createCubeMesh(size = 1): Mesh {
  const s = size / 2;
  const vertices: number[] = [];
  const indices: number[] = [];
  const stride = 8;

  // 六个面
  const faces = [
    { // 前
      corners: [[-s, -s, s], [s, -s, s], [s, s, s], [-s, s, s]],
      normal: [0, 0, 1],
    },
    { // 后
      corners: [[s, -s, -s], [-s, -s, -s], [-s, s, -s], [s, s, -s]],
      normal: [0, 0, -1],
    },
    { // 上
      corners: [[-s, s, s], [s, s, s], [s, s, -s], [-s, s, -s]],
      normal: [0, 1, 0],
    },
    { // 下
      corners: [[-s, -s, -s], [s, -s, -s], [s, -s, s], [-s, -s, s]],
      normal: [0, -1, 0],
    },
    { // 右
      corners: [[s, -s, s], [s, -s, -s], [s, s, -s], [s, s, s]],
      normal: [1, 0, 0],
    },
    { // 左
      corners: [[-s, -s, -s], [-s, -s, s], [-s, s, s], [-s, s, -s]],
      normal: [-1, 0, 0],
    },
  ];

  const uvs = [[0, 0], [1, 0], [1, 1], [0, 1]];

  for (const face of faces) {
    const base = vertices.length / stride;
    for (let i = 0; i < 4; i++) {
      vertices.push(
        face.corners[i][0], face.corners[i][1], face.corners[i][2],
        face.normal[0], face.normal[1], face.normal[2],
        uvs[i][0], uvs[i][1]
      );
    }
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }

  return new Mesh({
    vertices: new Float32Array(vertices),
    indices: new Uint16Array(indices),
    vertexCount: vertices.length / stride,
    indexCount: indices.length,
    stride,
  }, { position: true, normal: true, uv: true }, 'cube');
}

/** 创建球体网格 */
export function createSphereMesh(radius = 0.5, segments = 16, rings = 12): Mesh {
  const vertices: number[] = [];
  const indices: number[] = [];
  const stride = 8;

  for (let r = 0; r <= rings; r++) {
    const phi = (r / rings) * Math.PI;
    for (let s = 0; s <= segments; s++) {
      const theta = (s / segments) * Math.PI * 2;

      const x = Math.sin(phi) * Math.cos(theta) * radius;
      const y = Math.cos(phi) * radius;
      const z = Math.sin(phi) * Math.sin(theta) * radius;

      const nx = Math.sin(phi) * Math.cos(theta);
      const ny = Math.cos(phi);
      const nz = Math.sin(phi) * Math.sin(theta);

      const u = s / segments;
      const v = r / rings;

      vertices.push(x, y, z, nx, ny, nz, u, v);
    }
  }

  for (let r = 0; r < rings; r++) {
    for (let s = 0; s < segments; s++) {
      const a = r * (segments + 1) + s;
      const b = a + segments + 1;
      indices.push(a, b, a + 1);
      indices.push(a + 1, b, b + 1);
    }
  }

  return new Mesh({
    vertices: new Float32Array(vertices),
    indices: new Uint16Array(indices),
    vertexCount: vertices.length / stride,
    indexCount: indices.length,
    stride,
  }, { position: true, normal: true, uv: true }, 'sphere');
}

/** 创建圆柱体网格 */
export function createCylinderMesh(radius = 0.5, height = 1, segments = 16): Mesh {
  const vertices: number[] = [];
  const indices: number[] = [];
  const stride = 8;
  const halfH = height / 2;

  // 侧面
  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    const x = Math.cos(theta) * radius;
    const z = Math.sin(theta) * radius;
    const nx = Math.cos(theta);
    const nz = Math.sin(theta);
    const u = i / segments;

    vertices.push(x, halfH, z, nx, 0, nz, u, 0);
    vertices.push(x, -halfH, z, nx, 0, nz, u, 1);
  }

  for (let i = 0; i < segments; i++) {
    const a = i * 2;
    const b = a + 1;
    const c = a + 2;
    const d = a + 3;
    indices.push(a, c, b, b, c, d);
  }

  // 顶面
  const topCenter = vertices.length / stride;
  vertices.push(0, halfH, 0, 0, 1, 0, 0.5, 0.5);
  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    vertices.push(Math.cos(theta) * radius, halfH, Math.sin(theta) * radius, 0, 1, 0, Math.cos(theta) * 0.5 + 0.5, Math.sin(theta) * 0.5 + 0.5);
  }
  for (let i = 0; i < segments; i++) {
    indices.push(topCenter, topCenter + 1 + i + 1, topCenter + 1 + i);
  }

  // 底面
  const botCenter = vertices.length / stride;
  vertices.push(0, -halfH, 0, 0, -1, 0, 0.5, 0.5);
  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    vertices.push(Math.cos(theta) * radius, -halfH, Math.sin(theta) * radius, 0, -1, 0, Math.cos(theta) * 0.5 + 0.5, Math.sin(theta) * 0.5 + 0.5);
  }
  for (let i = 0; i < segments; i++) {
    indices.push(botCenter, botCenter + 1 + i, botCenter + 1 + i + 1);
  }

  return new Mesh({
    vertices: new Float32Array(vertices),
    indices: new Uint16Array(indices),
    vertexCount: vertices.length / stride,
    indexCount: indices.length,
    stride,
  }, { position: true, normal: true, uv: true }, 'cylinder');
}
