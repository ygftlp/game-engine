// 相机系统：支持 2D/3D 相机、跟随、平滑移动、视口裁剪。
import { Vec3, Mat4 } from '../math/Mat4';
import { Node } from '../core/Node';

/** 相机类型 */
export type CameraType = '2d' | '3d';

/** 相机配置 */
export interface CameraConfig {
  type?: CameraType;
  /** 视口宽度 */
  viewportWidth: number;
  /** 视口高度 */
  viewportHeight: number;
  /** 近裁剪面 */
  near?: number;
  /** 远裁剪面 */
  far?: number;
  /** 3D 透视 FOV（弧度） */
  fov?: number;
}

/**
 * 相机：控制视口和投影。
 */
export class Camera {
  readonly type: CameraType;

  /** 相机位置 */
  position: Vec3 = new Vec3();
  /** 相机目标点（3D 用） */
  target: Vec3 = new Vec3(0, 0, 0);
  /** 世界向上方向 */
  up: Vec3 = new Vec3(0, 1, 0);

  /** 视口 */
  viewportWidth: number;
  viewportHeight: number;

  /** 3D 参数 */
  near: number;
  far: number;
  fov: number;

  /** 2D 参数 */
  zoom = 1;
  rotation = 0;

  /** 跟随目标 */
  followTarget: Node | null = null;
  /** 跟随平滑度（0=无平滑，1=瞬移） */
  followSmooth = 0.1;
  /** 跟随偏移 */
  followOffset: Vec3 = new Vec3();

  private viewMatrix = new Mat4();
  private projectionMatrix = new Mat4();
  private vpMatrix = new Mat4();

  constructor(config: CameraConfig) {
    this.type = config.type ?? '2d';
    this.viewportWidth = config.viewportWidth;
    this.viewportHeight = config.viewportHeight;
    this.near = config.near ?? 0.1;
    this.far = config.far ?? 1000;
    this.fov = config.fov ?? Math.PI / 4;

    this.updateProjection();
  }

  /** 更新投影矩阵 */
  updateProjection(): void {
    if (this.type === '2d') {
      const w = this.viewportWidth / this.zoom;
      const h = this.viewportHeight / this.zoom;
      this.projectionMatrix = Mat4.ortho(-w / 2, w / 2, -h / 2, h / 2, this.near, this.far);
    } else {
      const aspect = this.viewportWidth / this.viewportHeight;
      this.projectionMatrix = Mat4.perspective(this.fov, aspect, this.near, this.far);
    }
  }

  /** 更新视图矩阵 */
  updateView(): void {
    if (this.type === '2d') {
      this.viewMatrix = new Mat4();
      this.viewMatrix.translate(-this.position.x, -this.position.y, -this.position.z);
      if (this.rotation !== 0) {
        this.viewMatrix.rotateZ(-this.rotation);
      }
    } else {
      this.viewMatrix = Mat4.lookAt(this.position, this.target, this.up);
    }
    this.vpMatrix = this.projectionMatrix.multiply(this.viewMatrix);
  }

  /** 更新相机（每帧调用） */
  update(dt: number): void {
    // 跟随目标
    if (this.followTarget) {
      const targetX = this.followTarget.x + this.followOffset.x;
      const targetY = this.followTarget.y + this.followOffset.y;
      const targetZ = this.followOffset.z;

      const t = 1 - Math.pow(1 - this.followSmooth, dt * 60);
      this.position.x += (targetX - this.position.x) * t;
      this.position.y += (targetY - this.position.y) * t;
      this.position.z += (targetZ - this.position.z) * t;
    }

    this.updateView();
  }

  /** 设置跟随目标 */
  setFollowTarget(target: Node | null, smooth = 0.1, offsetX = 0, offsetY = 0): void {
    this.followTarget = target;
    this.followSmooth = smooth;
    this.followOffset = new Vec3(offsetX, offsetY, 0);
  }

  /** 获取视图矩阵 */
  getViewMatrix(): Mat4 {
    return this.viewMatrix;
  }

  /** 获取投影矩阵 */
  getProjectionMatrix(): Mat4 {
    return this.projectionMatrix;
  }

  /** 获取 VP 矩阵 */
  getVPMatrix(): Mat4 {
    return this.vpMatrix;
  }

  /** 屏幕坐标 → 世界坐标（2D） */
  screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    const w = this.viewportWidth / this.zoom;
    const h = this.viewportHeight / this.zoom;
    return {
      x: (screenX / this.viewportWidth - 0.5) * w + this.position.x,
      y: (screenY / this.viewportHeight - 0.5) * h + this.position.y,
    };
  }

  /** 世界坐标 → 屏幕坐标（2D） */
  worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    const w = this.viewportWidth / this.zoom;
    const h = this.viewportHeight / this.zoom;
    return {
      x: ((worldX - this.position.x) / w + 0.5) * this.viewportWidth,
      y: ((worldY - this.position.y) / h + 0.5) * this.viewportHeight,
    };
  }

  /** 检查世界矩形是否在视口内 */
  isVisible(x: number, y: number, width: number, height: number): boolean {
    const hw = this.viewportWidth / this.zoom / 2;
    const hh = this.viewportHeight / this.zoom / 2;
    return (
      x + width > this.position.x - hw &&
      x < this.position.x + hw &&
      y + height > this.position.y - hh &&
      y < this.position.y + hh
    );
  }

  /** 缩放 */
  setZoom(zoom: number): void {
    this.zoom = Math.max(0.1, Math.min(10, zoom));
    this.updateProjection();
  }

  /** 平移到目标位置 */
  panTo(x: number, y: number, smooth = 0.1): void {
    const t = smooth;
    this.position.x += (x - this.position.x) * t;
    this.position.y += (y - this.position.y) * t;
  }

  /** 震动效果 */
  shake(intensity: number, duration: number): void {
    const startTime = Date.now();
    const originalX = this.position.x;
    const originalY = this.position.y;

    const doShake = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      if (elapsed >= duration) {
        this.position.x = originalX;
        this.position.y = originalY;
        return;
      }

      const decay = 1 - elapsed / duration;
      this.position.x = originalX + (Math.random() - 0.5) * intensity * decay * 2;
      this.position.y = originalY + (Math.random() - 0.5) * intensity * decay * 2;

      requestAnimationFrame(doShake);
    };

    doShake();
  }
}
