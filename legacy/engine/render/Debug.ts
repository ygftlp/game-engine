// 调试工具：FPS 显示、碰撞盒可视化。
import { Renderer } from './Renderer';
import { Node } from '../core/Node';
import { Rect, Circle } from '../collision/Collision';

export interface DebugConfig {
  /** 是否显示 FPS。 */
  showFPS?: boolean;
  /** 是否显示碰撞盒。 */
  showCollisionBoxes?: boolean;
  /** FPS 显示位置。 */
  fpsPosition?: { x: number; y: number };
  /** FPS 文字颜色。 */
  fpsColor?: string;
  /** 碰撞盒颜色。 */
  collisionBoxColor?: string;
  /** 圆形碰撞盒颜色。 */
  circleColor?: string;
}

export class Debug {
  private fps = 0;
  private frameCount = 0;
  private lastTime = 0;
  private fpsUpdateInterval = 500; // 毫秒
  private lastFpsUpdate = 0;

  private config: Required<DebugConfig> = {
    showFPS: true,
    showCollisionBoxes: true,
    fpsPosition: { x: 10, y: 10 },
    fpsColor: '#00ff00',
    collisionBoxColor: '#ff0000',
    circleColor: '#00ffff',
  };

  constructor(config?: DebugConfig) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  /** 更新 FPS 计数。 */
  updateFPS(time: number): void {
    if (this.lastTime === 0) {
      this.lastTime = time;
      this.lastFpsUpdate = time;
      this.frameCount = 0;
      return;
    }
    this.frameCount++;
    if (time - this.lastFpsUpdate >= this.fpsUpdateInterval) {
      this.fps = Math.round((this.frameCount * 1000) / (time - this.lastFpsUpdate));
      this.frameCount = 1;
      this.lastFpsUpdate = time;
    }
    this.lastTime = time;
  }

  /** 渲染 FPS 显示。 */
  renderFPS(renderer: Renderer): void {
    if (!this.config.showFPS) return;
    const ctx = renderer.ctx;
    ctx.save();
    ctx.fillStyle = this.config.fpsColor;
    ctx.font = '16px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`FPS: ${this.fps}`, this.config.fpsPosition.x, this.config.fpsPosition.y);
    ctx.restore();
  }

  /** 渲染节点树中所有节点的碰撞盒。 */
  renderCollisionBoxes(renderer: Renderer, node: Node): void {
    if (!this.config.showCollisionBoxes) return;
    this.renderNodeCollisionBox(renderer, node);
    for (const child of node.children) {
      this.renderCollisionBoxes(renderer, child);
    }
  }

  private renderNodeCollisionBox(renderer: Renderer, node: Node): void {
    if (node.width <= 0 || node.height <= 0) return;

    const ctx = renderer.ctx;
    const left = -node.width * node.anchorX;
    const top = -node.height * node.anchorY;

    ctx.save();
    ctx.transform(
      node.worldMatrix.a,
      node.worldMatrix.b,
      node.worldMatrix.c,
      node.worldMatrix.d,
      node.worldMatrix.e,
      node.worldMatrix.f
    );
    ctx.strokeStyle = this.config.collisionBoxColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(left, top, node.width, node.height);
    ctx.restore();
  }

  /** 渲染 AABB 矩形碰撞盒。 */
  renderAABB(renderer: Renderer, rect: Rect): void {
    const ctx = renderer.ctx;
    ctx.save();
    ctx.strokeStyle = this.config.collisionBoxColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
    ctx.restore();
  }

  /** 渲染圆形碰撞盒。 */
  renderCircle(renderer: Renderer, circle: Circle): void {
    const ctx = renderer.ctx;
    ctx.save();
    ctx.strokeStyle = this.config.circleColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  /** 获取当前 FPS。 */
  getFPS(): number {
    return this.fps;
  }

  /** 更新配置。 */
  setConfig(config: Partial<DebugConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /** 获取当前配置。 */
  getConfig(): DebugConfig {
    return { ...this.config };
  }
}