import { Node, Renderer, TouchPoint } from 'lite-game-engine';

export class Player extends Node {
  private targetX = 0;
  private targetY = 0;

  constructor(x: number, y: number) {
    super();
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
    this.width = 56;
    this.height = 56;
  }

  moveTo(point: TouchPoint): void {
    this.targetX = point.x;
    this.targetY = point.y;
  }

  update(dt: number): void {
    super.update(dt);
    const speed = 10;
    const t = 1 - Math.pow(1 - 0.18, dt * 60 * speed * 0.1);
    this.x += (this.targetX - this.x) * t;
    this.y += (this.targetY - this.y) * t;
  }

  protected draw(renderer: Renderer): void {
    const ctx = renderer.ctx;
    ctx.fillStyle = '#4ecdc4';
    ctx.beginPath();
    ctx.moveTo(0, -32);
    ctx.lineTo(28, 28);
    ctx.lineTo(0, 14);
    ctx.lineTo(-28, 28);
    ctx.closePath();
    ctx.fill();
  }
}
