// 生命条组件：用于显示角色生命值。
import { UIWidget } from './UIWidget';
import { Renderer } from '../render/Renderer';
import { MathUtils } from '../utils/MathUtils';

export class HealthBar extends UIWidget {
  /** 当前生命值 */
  private _health = 1;
  /** 最大生命值 */
  maxHealth = 1;
  /** 背景色 */
  bgColor = '#2d2d44';
  /** 生命条颜色 */
  healthColor = '#e74c3c';
  /** 低生命值颜色 */
  lowHealthColor = '#f39c12';
  /** 低生命值阈值 */
  lowHealthThreshold = 0.3;
  /** 是否显示数字 */
  showNumber = false;
  /** 是否显示边框 */
  showBorder = true;
  /** 边框颜色 */
  borderColor = '#ffffff';

  constructor(width = 100, height = 12) {
    super();
    this.width = width;
    this.height = height;
    this.interactive = false;
  }

  /** 获取当前生命值 */
  get health(): number {
    return this._health;
  }

  /** 设置当前生命值 */
  set health(val: number) {
    this._health = MathUtils.clamp(val, 0, this.maxHealth);
  }

  /** 获取生命值百分比 */
  get percent(): number {
    return this._health / this.maxHealth;
  }

  /** 设置生命值（带范围检查） */
  setHealth(current: number, max?: number): void {
    if (max !== undefined) this.maxHealth = max;
    this.health = current;
  }

  protected draw(renderer: Renderer): void {
    const ctx = renderer.ctx;
    const x = -this.width * this.anchorX;
    const y = -this.height * this.anchorY;
    const percent = this.percent;

    // 绘制背景
    ctx.fillStyle = this.bgColor;
    this.drawRoundRect(ctx, x, y, this.width, this.height, this.height / 2);
    ctx.fill();

    // 绘制生命条
    const fillColor = percent <= this.lowHealthThreshold ? this.lowHealthColor : this.healthColor;
    ctx.fillStyle = fillColor;
    const fillWidth = this.width * percent;
    ctx.save();
    ctx.beginPath();
    this.drawRoundRect(ctx, x, y, this.width, this.height, this.height / 2);
    ctx.clip();
    ctx.fillRect(x, y, fillWidth, this.height);
    ctx.restore();

    // 绘制边框
    if (this.showBorder) {
      ctx.strokeStyle = this.borderColor;
      ctx.lineWidth = 1;
      this.drawRoundRect(ctx, x, y, this.width, this.height, this.height / 2);
      ctx.stroke();
    }

    // 绘制数字
    if (this.showNumber) {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${Math.round(this._health)}/${Math.round(this.maxHealth)}`, 0, 0);
    }
  }
}