// 虚拟摇杆组件：用于移动端游戏控制。
import { UIWidget } from './UIWidget';
import { Renderer } from '../render/Renderer';
import { TouchPoint } from '../input/Input';
import { Vec2 } from '../math/Vec2';

export class Joystick extends UIWidget {
  /** 摇杆方向（归一化） */
  direction = new Vec2();
  /** 摇杆力度（0-1） */
  force = 0;
  /** 外圈半径 */
  outerRadius = 60;
  /** 内圈半径 */
  innerRadius = 25;
  /** 外圈颜色 */
  outerColor = 'rgba(255,255,255,0.2)';
  /** 内圈颜色 */
  innerColor = 'rgba(255,255,255,0.6)';
  /** 是否固定位置 */
  fixed = true;
  /** 值改变回调 */
  onChangeCallback: ((direction: Vec2, force: number) => void) | null = null;

  private touchId = -1;
  private knobX = 0;
  private knobY = 0;

  constructor() {
    super();
    this.width = 120;
    this.height = 120;
    this.outerRadius = 60;
    this.innerRadius = 25;
  }

  onTouchStart(point: TouchPoint): void {
    if (this.touchId >= 0) return;
    this.touchId = point.id;
    this.updateKnob(point);
  }

  onTouchMove(point: TouchPoint): void {
    if (point.id !== this.touchId) return;
    this.updateKnob(point);
  }

  onTouchEnd(point: TouchPoint): void {
    if (point.id !== this.touchId) return;
    if (!this.interactive) return;
    this.touchId = -1;
    this.knobX = 0;
    this.knobY = 0;
    this.direction.set(0, 0);
    this.force = 0;
    if (this.onChangeCallback) {
      this.onChangeCallback(this.direction, this.force);
    }
  }

  private updateKnob(point: TouchPoint): void {
    const local = this.worldMatrix.invertPoint(point.x, point.y);
    if (!local) return;
    let dx = local.x;
    let dy = local.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > this.outerRadius) {
      dx = (dx / dist) * this.outerRadius;
      dy = (dy / dist) * this.outerRadius;
    }

    this.knobX = dx;
    this.knobY = dy;
    this.force = Math.min(1, dist / this.outerRadius);
    this.direction.set(dx / (dist || 1), dy / (dist || 1));

    if (this.onChangeCallback) {
      this.onChangeCallback(this.direction, this.force);
    }
  }

  protected draw(renderer: Renderer): void {
    const ctx = renderer.ctx;

    // 绘制外圈
    ctx.fillStyle = this.outerColor;
    ctx.beginPath();
    ctx.arc(0, 0, this.outerRadius, 0, Math.PI * 2);
    ctx.fill();

    // 绘制内圈（摇杆头）
    ctx.fillStyle = this.innerColor;
    ctx.beginPath();
    ctx.arc(this.knobX, this.knobY, this.innerRadius, 0, Math.PI * 2);
    ctx.fill();
  }
}