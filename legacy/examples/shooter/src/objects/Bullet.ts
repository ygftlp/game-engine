import { Node, Rect, Renderer } from 'lite-game-engine';

export class Bullet extends Node {
  readonly speed = 760;

  constructor(x: number, y: number) {
    super();
    this.x = x;
    this.y = y;
    this.width = 8;
    this.height = 24;
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
    this.y -= this.speed * dt;
  }

  protected draw(renderer: Renderer): void {
    renderer.drawRect(-this.width / 2, -this.height / 2, this.width, this.height, '#ffd166');
  }
}
