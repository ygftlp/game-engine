import { Collision, Engine, Scene, TextNode } from 'lite-game-engine';
import { Bullet } from '../objects/Bullet';
import { Enemy } from '../objects/Enemy';
import { Player } from '../objects/Player';
import { HUD } from '../ui/HUD';

export class ShooterScene extends Scene {
  private readonly player: Player;
  private readonly hud: HUD;
  private readonly bullets: Bullet[] = [];
  private readonly enemies: Enemy[] = [];
  private spawnTimer = 0;
  private fireTimer = 0;
  private score = 0;

  constructor(private readonly engine: Engine) {
    super();

    const title = new TextNode('Shooter Example', '#ffffff', '32px sans-serif');
    title.x = engine.width / 2;
    title.y = 104;
    this.addChild(title);

    this.player = new Player(engine.width / 2, engine.height * 0.76);
    this.addChild(this.player);

    this.hud = new HUD(engine, () => this.fire());
    this.addChild(this.hud);

    engine.input.onStart((touches) => {
      const point = touches[0];
      if (point) this.player.setTarget(point);
    });

    engine.input.onMove((touches) => {
      const point = touches[0];
      if (point) this.player.setTarget(point);
    });
  }

  update(dt: number): void {
    super.update(dt);
    this.spawnTimer += dt;
    this.fireTimer += dt;

    if (this.spawnTimer >= 0.7) {
      this.spawnTimer = 0;
      this.spawnEnemy();
    }

    if (this.fireTimer >= 0.28) {
      this.fireTimer = 0;
      this.fire();
    }

    this.removeOutOfBoundsObjects();
    this.resolveCollisions();
  }

  private fire(): void {
    const bullet = new Bullet(this.player.x, this.player.y - 42);
    this.bullets.push(bullet);
    this.addChild(bullet);
  }

  private spawnEnemy(): void {
    const margin = 60;
    const x = margin + Math.random() * (this.engine.width - margin * 2);
    const speed = 180 + Math.random() * 120;
    const enemy = new Enemy(x, -40, speed);
    this.enemies.push(enemy);
    this.addChild(enemy);
  }

  private removeOutOfBoundsObjects(): void {
    this.removeWhere(this.bullets, (bullet) => bullet.y < -80);
    this.removeWhere(this.enemies, (enemy) => enemy.y > this.engine.height + 80);
  }

  private resolveCollisions(): void {
    for (const bullet of [...this.bullets]) {
      for (const enemy of [...this.enemies]) {
        if (!Collision.rectIntersect(bullet.rect, enemy.rect)) continue;
        this.removeObject(this.bullets, bullet);
        this.removeObject(this.enemies, enemy);
        this.score += 10;
        this.hud.setScore(this.score);
        break;
      }
    }
  }

  private removeWhere<T extends { removeFromParent(): void }>(items: T[], shouldRemove: (item: T) => boolean): void {
    for (const item of [...items]) {
      if (shouldRemove(item)) this.removeObject(items, item);
    }
  }

  private removeObject<T extends { removeFromParent(): void }>(items: T[], item: T): void {
    const index = items.indexOf(item);
    if (index >= 0) items.splice(index, 1);
    item.removeFromParent();
  }
}
