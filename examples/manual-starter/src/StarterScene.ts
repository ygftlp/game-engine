import { Logger, Node, Renderer, Scene } from '../../../src/engine';

interface StarNode extends Node {
  angularSpeed?: number;
  radius?: number;
  color?: string;
}

const starterLogger = Logger.forModule('ManualStarter');

export class StarterScene extends Scene {
  private stars: StarNode[] = [];
  private elapsed = 0;

  onEnter(): void {
    starterLogger.info('starter scene ready');
    this.spawnStar(200, 180, 0.4);
  }

  update(dt: number): void {
    super.update(dt);
    this.elapsed += dt;
    for (const star of this.stars) {
      star.rotation += (star.angularSpeed ?? 0) * dt;
    }
  }

  spawnStar(x: number, y: number, angularSpeed: number): void {
    const star = new Node() as StarNode;
    star.x = x;
    star.y = y;
    star.radius = 12 + Math.random() * 18;
    star.width = (star.radius ?? 16) * 2;
    star.height = star.width;
    star.angularSpeed = angularSpeed;
    star.color = ['#6fe7ff', '#ffd76f', '#9d7dff', '#7bffb2'][this.stars.length % 4];
    this.stars.push(star);
    this.addChild(star);
  }

  protected draw(renderer: Renderer): void {
    const { ctx } = renderer;
    ctx.fillStyle = '#07111f';
    ctx.fillRect(0, 0, 400, 720);

    const gradient = ctx.createLinearGradient(0, 0, 0, 260);
    gradient.addColorStop(0, '#0d223d');
    gradient.addColorStop(1, 'rgba(13, 34, 61, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 400, 260);

    for (const star of this.stars) {
      this.drawStar(ctx, star);
    }

    ctx.fillStyle = '#cce7ff';
    ctx.font = '24px sans-serif';
    ctx.fillText(`Stars: ${this.stars.length}`, 24, 40);
    ctx.fillText(`Time: ${this.elapsed.toFixed(1)}s`, 24, 72);
    ctx.fillStyle = '#7fa2c8';
    ctx.font = '16px sans-serif';
    ctx.fillText('Tap to create more stars', 24, 110);
  }

  private drawStar(ctx: CanvasRenderingContext2D, star: StarNode): void {
    const radius = star.radius ?? 16;
    const innerRadius = radius * 0.48;

    ctx.save();
    ctx.translate(star.x, star.y);
    ctx.rotate(star.rotation);
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const angle = -Math.PI / 2 + i * Math.PI / 5;
      const currentRadius = i % 2 === 0 ? radius : innerRadius;
      const px = Math.cos(angle) * currentRadius;
      const py = Math.sin(angle) * currentRadius;
      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.closePath();
    ctx.fillStyle = star.color ?? '#6fe7ff';
    ctx.shadowBlur = 18;
    ctx.shadowColor = star.color ?? '#6fe7ff';
    ctx.fill();
    ctx.restore();
  }
}
