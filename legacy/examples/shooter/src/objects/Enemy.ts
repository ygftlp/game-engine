import { Node, Rect, Renderer } from 'lite-game-engine';

export class Enemy extends Node {
  readonly speed: number;

  constructor(x: number, y: number, speed: number) {
    super();
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.width = 52;
    this.height = 52;
  }

  get rect(): Rect {
    return {
      x: this.x - this.width / 2,
      y: this.y - this.height / 2,
      width: this.width,
      height: this.height,
    };
  }

  update(dt: number): void {
    super.update(dt);
    this.y += this.speed * dt;
  }

  protected draw(renderer: Renderer): void {
    const ctx = renderer.ctx;
    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.moveTo(0, 28);
    ctx.lineTo(26, -20);
    ctx.lineTo(0, -8);
    ctx.lineTo(-26, -20);
    ctx.closePath();
    ctx.fill();
  }
}
