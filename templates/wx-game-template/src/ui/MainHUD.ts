import { Engine, TextNode, UIManager } from 'lite-game-engine';

export class MainHUD extends UIManager {
  private scoreText: TextNode;

  constructor(engine: Engine) {
    super(engine.input);
    this.scoreText = new TextNode('分数 0', '#ffffff', '28px sans-serif', 'left');
    this.scoreText.x = 32;
    this.scoreText.y = 56;
    this.addChild(this.scoreText);
  }

  setScore(score: number): void {
    this.scoreText.text = `分数 ${score}`;
  }
}
