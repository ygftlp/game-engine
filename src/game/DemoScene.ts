// 示例场景：一个可触摸拖动的方块（player），与一个静止方块（target）做 AABB 碰撞检测。
import { Scene, Renderer, Node, Input, Collision, Rect } from '../engine';

class Box extends Node {
  constructor(public size: number, public color: string) {
    super();
  }

  get rect(): Rect {
    return { x: this.x - this.size / 2, y: this.y - this.size / 2, width: this.size, height: this.size };
  }

  protected draw(renderer: Renderer): void {
    renderer.drawRect(-this.size / 2, -this.size / 2, this.size, this.size, this.color);
  }
}

export class DemoScene extends Scene {
  private player: Box;
  private target: Box;
  private dragging = false;

  constructor(width: number, height: number, input: Input) {
    super();
    this.target = new Box(160, '#4caf50');
    this.target.x = width / 2;
    this.target.y = height / 3;
    this.addChild(this.target);

    this.player = new Box(120, '#2196f3');
    this.player.x = width / 2;
    this.player.y = (height * 2) / 3;
    this.addChild(this.player);

    input.onStart((touches) => {
      const t = touches[0];
      if (t && Collision.pointInRect(t.x, t.y, this.player.rect)) this.dragging = true;
    });
    input.onMove((touches) => {
      const t = touches[0];
      if (this.dragging && t) {
        this.player.x = t.x;
        this.player.y = t.y;
      }
    });
    input.onEnd(() => {
      this.dragging = false;
    });
  }

  update(_dt: number): void {
    const hit = Collision.rectIntersect(this.player.rect, this.target.rect);
    this.player.color = hit ? '#f44336' : '#2196f3';
  }
}
