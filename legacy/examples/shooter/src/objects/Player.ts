import { Node, Rect, Renderer, TouchPoint } from 'lite-game-engine';

export class Player extends Node {
  private targetX: number;
  private targetY: number;

  constructor(x: number, y: number) {
    super();
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
    this.width = 52;
    this.height = 64;
  }

  get rect(): Rect {
    return {
      x: this.x - this.width / 2,
      y: this.y - this.height / 2,
      width: this.width,
      height: this.height,
    };
  }

  setTarget(point: TouchPoint): void {
    this.targetX = point.x;
    this.targetY = point.y;
  }

  update(dt: number): void {
    super.update(dt);
    const t = 1 - Math.pow(0.001, dt);
    this.x += (this.targetX - this.x) * t;
    this.y += (this.targetY - this.y) * t;
  }

  protected draw(renderer: Renderer): void {
    const ctx = renderer.ctx;
    ctx.fillStyle = '#4ecdc4';
    ctx.beginPath();
    ctx.moveTo(0, -34);
    ctx.lineTo(26, 30);
    ctx.lineTo(0, 16);
    ctx.lineTo(-26, 30);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-4, -18, 8, 28);
  }
}
