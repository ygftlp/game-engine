// 光照系统：支持环境光、方向光、点光源、聚光灯、阴影贴图。
import { Vec3, Mat4 } from '../math/Mat4';

/** 光源类型 */
export type LightType = 'ambient' | 'directional' | 'point' | 'spot';

/** 基础光源配置 */
export interface LightConfig {
  type: LightType;
  /** 颜色 */
  color?: Vec3;
  /** 强度 */
  intensity?: number;
  /** 是否启用 */
  enabled?: boolean;
}

/** 方向光配置 */
export interface DirectionalLightConfig extends LightConfig {
  type: 'directional';
  /** 方向（归一化） */
  direction?: Vec3;
  /** 是否投射阴影 */
  castShadow?: boolean;
  /** 阴影贴图尺寸 */
  shadowMapSize?: number;
}

/** 点光源配置 */
export interface PointLightConfig extends LightConfig {
  type: 'point';
  /** 位置 */
  position?: Vec3;
  /** 衰减半径 */
  radius?: number;
  /** 衰减系数 */
  decay?: number;
}

/** 聚光灯配置 */
export interface SpotLightConfig extends LightConfig {
  type: 'spot';
  /** 位置 */
  position?: Vec3;
  /** 方向 */
  direction?: Vec3;
  /** 内锥角（弧度） */
  innerAngle?: number;
  /** 外锥角（弧度） */
  outerAngle?: number;
  /** 衰减半径 */
  radius?: number;
}

/**
 * 光源基类
 */
export class Light {
  type: LightType;
  color: Vec3;
  intensity: number;
  enabled: boolean;

  constructor(config: LightConfig) {
    this.type = config.type;
    this.color = config.color?.clone() ?? new Vec3(1, 1, 1);
    this.intensity = config.intensity ?? 1;
    this.enabled = config.enabled ?? true;
  }
}

/**
 * 方向光：模拟太阳光，平行光线。
 */
export class DirectionalLight extends Light {
  direction: Vec3;
  castShadow: boolean;
  shadowMapSize: number;

  /** 阴影相关矩阵 */
  lightSpaceMatrix = new Mat4();

  constructor(config: DirectionalLightConfig) {
    super(config);
    this.type = 'directional';
    this.direction = config.direction?.normalize() ?? new Vec3(0, -1, 0);
    this.castShadow = config.castShadow ?? false;
    this.shadowMapSize = config.shadowMapSize ?? 1024;
  }

  /** 设置方向 */
  setDirection(x: number, y: number, z: number): void {
    this.direction.set(x, y, z).normalize();
  }

  /** 更新阴影矩阵 */
  updateShadowMatrix(sceneBounds: { min: Vec3; max: Vec3 }): void {
    const center = sceneBounds.min.add(sceneBounds.max).scale(0.5);
    const extent = sceneBounds.max.sub(sceneBounds.min).scale(0.5);
    const radius = extent.length();

    const eye = center.sub(this.direction.scale(radius * 2));
    const view = Mat4.lookAt(eye, center, new Vec3(0, 1, 0));
    const projection = Mat4.ortho(-radius, radius, -radius, radius, 0.1, radius * 4);
    this.lightSpaceMatrix = projection.multiply(view);
  }
}

/**
 * 点光源：从一个点向所有方向发光。
 */
export class PointLight extends Light {
  position: Vec3;
  radius: number;
  decay: number;

  constructor(config: PointLightConfig) {
    super(config);
    this.type = 'point';
    this.position = config.position?.clone() ?? new Vec3();
    this.radius = config.radius ?? 100;
    this.decay = config.decay ?? 2;
  }

  /** 设置位置 */
  setPosition(x: number, y: number, z: number): void {
    this.position.set(x, y, z);
  }

  /** 计算衰减 */
  getAttenuation(distance: number): number {
    if (distance >= this.radius) return 0;
    const d = distance / this.radius;
    return Math.pow(1 - d, this.decay);
  }
}

/**
 * 聚光灯：锥形光源。
 */
export class SpotLight extends Light {
  position: Vec3;
  direction: Vec3;
  innerAngle: number;
  outerAngle: number;
  radius: number;

  constructor(config: SpotLightConfig) {
    super(config);
    this.type = 'spot';
    this.position = config.position?.clone() ?? new Vec3();
    this.direction = config.direction?.normalize() ?? new Vec3(0, -1, 0);
    this.innerAngle = config.innerAngle ?? Math.PI / 6;
    this.outerAngle = config.outerAngle ?? Math.PI / 4;
    this.radius = config.radius ?? 100;
  }

  /** 计算聚光灯衰减 */
  getSpotFactor(lightDir: Vec3): number {
    const cosAngle = this.direction.dot(lightDir);
    const cosInner = Math.cos(this.innerAngle);
    const cosOuter = Math.cos(this.outerAngle);
    return Math.max(0, (cosAngle - cosOuter) / (cosInner - cosOuter));
  }
}

/**
 * 光照管理器：管理场景中所有光源。
 */
export class LightManager {
  private lights: Light[] = [];
  private ambientColor = new Vec3(0.1, 0.1, 0.1);
  private ambientIntensity = 0.3;

  /** 添加光源 */
  addLight(light: Light): void {
    this.lights.push(light);
  }

  /** 移除光源 */
  removeLight(light: Light): void {
    const idx = this.lights.indexOf(light);
    if (idx >= 0) this.lights.splice(idx, 1);
  }

  /** 获取所有启用的光源 */
  getActiveLights(): Light[] {
    return this.lights.filter(l => l.enabled);
  }

  /** 按类型获取光源 */
  getLightsByType(type: LightType): Light[] {
    return this.lights.filter(l => l.type === type && l.enabled);
  }

  /** 设置环境光 */
  setAmbient(color: Vec3, intensity = 0.3): void {
    this.ambientColor = color.clone();
    this.ambientIntensity = intensity;
  }

  /** 获取环境光颜色（已乘以强度） */
  getAmbientColor(): Vec3 {
    return this.ambientColor.scale(this.ambientIntensity);
  }

  /** 计算指定点的光照颜色 */
  calculateLighting(position: Vec3, normal: Vec3): Vec3 {
    let result = this.getAmbientColor();

    for (const light of this.lights) {
      if (!light.enabled) continue;

      switch (light.type) {
        case 'directional': {
          const dir = (light as DirectionalLight).direction.scale(-1);
          const ndotl = Math.max(0, normal.dot(dir));
          result = result.add(light.color.scale(light.intensity * ndotl));
          break;
        }
        case 'point': {
          const pl = light as PointLight;
          const toLight = pl.position.sub(position);
          const dist = toLight.length();
          const attenuation = pl.getAttenuation(dist);
          const dir = toLight.normalize();
          const ndotl = Math.max(0, normal.dot(dir));
          result = result.add(light.color.scale(light.intensity * ndotl * attenuation));
          break;
        }
        case 'spot': {
          const sl = light as SpotLight;
          const toLight = sl.position.sub(position);
          const dist = toLight.length();
          const dir = toLight.normalize();
          const spotFactor = sl.getSpotFactor(dir.scale(-1));
          const attenuation = dist < sl.radius ? 1 - dist / sl.radius : 0;
          const ndotl = Math.max(0, normal.dot(dir));
          result = result.add(light.color.scale(light.intensity * ndotl * attenuation * spotFactor));
          break;
        }
      }
    }

    // 限制到 [0,1]
    return new Vec3(
      Math.min(1, Math.max(0, result.x)),
      Math.min(1, Math.max(0, result.y)),
      Math.min(1, Math.max(0, result.z))
    );
  }

  /** 清除所有光源 */
  clear(): void {
    this.lights.length = 0;
  }
}
