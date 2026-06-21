// 材质系统：支持多种材质类型、纹理映射、法线贴图、PBR 参数。

import { Vec3 } from '../math/Mat4';

/** 材质类型 */
export type MaterialType = 'unlit' | 'lambert' | 'phong' | 'pbr';

/** 纹理通道 */
export interface TextureChannel {
  /** 纹理单元 */
  unit: number;
  /** UV 变换 */
  offset?: Vec3;
  scale?: Vec3;
}

/** 基础材质配置 */
export interface MaterialConfig {
  name?: string;
  type?: MaterialType;
  /** 基础颜色 */
  albedo?: Vec3;
  /** 金属度 0-1 */
  metallic?: number;
  /** 粗糙度 0-1 */
  roughness?: number;
  /** 环境光遮蔽 0-1 */
  ao?: number;
  /** 自发光颜色 */
  emissive?: Vec3;
  /** 自发光强度 */
  emissiveIntensity?: number;
  /** 透明度 0-1 */
  opacity?: number;
  /** 是否双面渲染 */
  doubleSided?: boolean;
  /** 深度测试 */
  depthTest?: boolean;
  /** 深度写入 */
  depthWrite?: boolean;
  /** 混合模式 */
  blendMode?: 'normal' | 'additive' | 'multiply' | 'screen';
}

/**
 * 材质：定义物体表面的渲染属性。
 */
export class Material {
  name: string;
  type: MaterialType;
  albedo: Vec3;
  metallic: number;
  roughness: number;
  ao: number;
  emissive: Vec3;
  emissiveIntensity: number;
  opacity: number;
  doubleSided: boolean;
  depthTest: boolean;
  depthWrite: boolean;
  blendMode: string;

  /** 纹理通道 */
  textures = new Map<string, TextureChannel>();

  /** 自定义 uniform */
  uniforms = new Map<string, number | number[] | boolean>();

  constructor(config?: MaterialConfig) {
    this.name = config?.name ?? 'default';
    this.type = config?.type ?? 'phong';
    this.albedo = config?.albedo?.clone() ?? new Vec3(1, 1, 1);
    this.metallic = config?.metallic ?? 0;
    this.roughness = config?.roughness ?? 0.5;
    this.ao = config?.ao ?? 1;
    this.emissive = config?.emissive?.clone() ?? new Vec3(0, 0, 0);
    this.emissiveIntensity = config?.emissiveIntensity ?? 1;
    this.opacity = config?.opacity ?? 1;
    this.doubleSided = config?.doubleSided ?? false;
    this.depthTest = config?.depthTest ?? true;
    this.depthWrite = config?.depthWrite ?? true;
    this.blendMode = config?.blendMode ?? 'normal';
  }

  /** 设置纹理 */
  setTexture(name: string, unit: number, offset?: Vec3, scale?: Vec3): this {
    this.textures.set(name, { unit, offset, scale });
    return this;
  }

  /** 设置 uniform */
  setUniform(name: string, value: number | number[] | boolean): this {
    this.uniforms.set(name, value);
    return this;
  }

  /** 克隆材质 */
  clone(): Material {
    const m = new Material({
      name: this.name + '_clone',
      type: this.type,
      albedo: this.albedo.clone(),
      metallic: this.metallic,
      roughness: this.roughness,
      ao: this.ao,
      emissive: this.emissive.clone(),
      emissiveIntensity: this.emissiveIntensity,
      opacity: this.opacity,
      doubleSided: this.doubleSided,
      depthTest: this.depthTest,
      depthWrite: this.depthWrite,
      blendMode: this.blendMode as any,
    });
    for (const [k, v] of this.textures) {
      m.textures.set(k, { ...v });
    }
    for (const [k, v] of this.uniforms) {
      m.uniforms.set(k, v);
    }
    return m;
  }
}

// ========== 预设材质 ==========

/** 不发光材质 */
export function createUnlitMaterial(albedo?: Vec3): Material {
  return new Material({ type: 'unlit', albedo });
}

/** Lambert 光照材质 */
export function createLambertMaterial(albedo?: Vec3): Material {
  return new Material({ type: 'lambert', albedo });
}

/** Phong 光照材质 */
export function createPhongMaterial(albedo?: Vec3, shininess = 32): Material {
  const m = new Material({ type: 'phong', albedo });
  m.setUniform('shininess', shininess);
  return m;
}

/** PBR 金属度材质 */
export function createPBRMaterial(albedo?: Vec3, metallic = 0, roughness = 0.5): Material {
  return new Material({ type: 'pbr', albedo, metallic, roughness });
}

/** 透明材质 */
export function createTransparentMaterial(albedo?: Vec3, opacity = 0.5): Material {
  return new Material({ albedo, opacity, doubleSided: true, depthWrite: false, blendMode: 'normal' });
}

/** 发光材质 */
export function createEmissiveMaterial(emissive?: Vec3, intensity = 2): Material {
  return new Material({ type: 'unlit', emissive, emissiveIntensity: intensity });
}
