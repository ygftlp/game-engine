import { Button, Engine, TextNode, UIManager } from 'lite-game-engine';

export class HUD extends UIManager {
  private readonly scoreText: TextNode;
  private readonly hintText: TextNode;
  readonly fireButton: Button;

  constructor(engine: Engine, onFire: () => void) {
    super(engine.input);

    this.scoreText = new TextNode('得分 0', '#ffffff', '28px sans-serif', 'left');
    this.scoreText.x = 32;
    this.scoreText.y = 52;
    this.addChild(this.scoreText);

    this.hintText = new TextNode('拖动移动，点击开火', '#b8c1ec', '22px sans-serif');
    this.hintText.x = engine.width / 2;
    this.hintText.y = engine.height - 48;
    this.addChild(this.hintText);

    this.fireButton = new Button('开火', 148, 56);
    this.fireButton.x = engine.width - 112;
    this.fireButton.y = engine.height - 112;
    this.fireButton.onClickCallback = onFire;
    this.addWidget(this.fireButton);
  }

  setScore(score: number): void {
    this.scoreText.text = `得分 ${score}`;
  }
}
