import { Engine, Scene, TextNode } from 'lite-game-engine';
import { Player } from '../objects/Player';
import { MainHUD } from '../ui/MainHUD';

export class MainScene extends Scene {
  private readonly player: Player;
  private readonly hud: MainHUD;
  private score = 0;

  constructor(private readonly engine: Engine) {
    super();

    const title = new TextNode('lite-game-engine 模板', '#ffffff', '32px sans-serif');
    title.x = engine.width / 2;
    title.y = engine.height * 0.18;
    this.addChild(title);

    this.player = new Player(engine.width / 2, engine.height * 0.58);
    this.addChild(this.player);

    this.hud = new MainHUD(engine);
    this.addChild(this.hud);

    engine.input.onStart((touches) => {
      const point = touches[0];
      if (!point) return;
      this.player.moveTo(point);
      this.score += 1;
      this.hud.setScore(this.score);
    });

    engine.input.onMove((touches) => {
      const point = touches[0];
      if (point) this.player.moveTo(point);
    });
  }

  update(dt: number): void {
    super.update(dt);
  }
}
