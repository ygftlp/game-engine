// Flappy Bird 游戏场景：休闲类游戏Demo，展示引擎的核心功能。
import { Scene, Node, Collision, Rect, Engine, Renderer, Logger } from '../../../engine';

type SceneWithEngine = FlappyBirdScene & { engine?: Engine };
const flappyLogger = Logger.forModule('FlappyBirdDemo');

const GRAVITY = 800;
const JUMP_FORCE = -300;
const PIPE_SPEED = 150;
const PIPE_GAP = 150;
const PIPE_WIDTH = 60;
const PIPE_INTERVAL = 2000;

export class FlappyBirdScene extends Scene {
  private bird!: Node;
  private birdVelocity = 0;
  private pipes: Node[] = [];
  private score = 0;
  private gameOver = false;
  private started = false;
  private lastPipeTime = 0;

  onEnter(): void {
    this.setupBird();
    this.setupInput();
    this.score = 0;
    this.gameOver = false;
    this.started = false;
    this.birdVelocity = 0;
  }

  private setupBird(): void {
    this.bird = new Node();
    this.bird.x = 100;
    this.bird.y = 300;
    this.bird.width = 30;
    this.bird.height = 30;
    this.addChild(this.bird);
  }

  private setupInput(): void {
    const engine = (this as SceneWithEngine).engine;
    if (engine && engine.input) {
      engine.input.onStart(() => {
        if (this.gameOver) {
          this.restart();
          return;
        }
        if (!this.started) {
          this.started = true;
        }
        this.birdVelocity = JUMP_FORCE;
      });
    }
  }

  update(dt: number): void {
    if (this.gameOver || !this.started) return;

    this.birdVelocity += GRAVITY * dt;
    this.bird.y += this.birdVelocity * dt;

    this.lastPipeTime += dt * 1000;
    if (this.lastPipeTime >= PIPE_INTERVAL) {
      this.spawnPipe();
      this.lastPipeTime = 0;
    }

    this.movePipes(dt);
    this.checkCollisions();
    this.checkBounds();
  }

  private spawnPipe(): void {
    const gapY = 100 + Math.random() * 300;

    const topPipe = new Node();
    topPipe.x = 400;
    topPipe.y = 0;
    topPipe.width = PIPE_WIDTH;
    topPipe.height = gapY - PIPE_GAP / 2;
    this.addChild(topPipe);
    this.pipes.push(topPipe);

    const bottomPipe = new Node();
    bottomPipe.x = 400;
    bottomPipe.y = gapY + PIPE_GAP / 2;
    bottomPipe.width = PIPE_WIDTH;
    bottomPipe.height = 600 - bottomPipe.y;
    this.addChild(bottomPipe);
    this.pipes.push(bottomPipe);

    this.score++;
  }

  private movePipes(dt: number): void {
    for (const pipe of this.pipes) {
      pipe.x -= PIPE_SPEED * dt;
    }
    this.pipes = this.pipes.filter((p) => {
      if (p.x + PIPE_WIDTH < 0) {
        p.removeFromParent();
        return false;
      }
      return true;
    });
  }

  private checkCollisions(): void {
    const birdRect: Rect = {
      x: this.bird.x - 15,
      y: this.bird.y - 15,
      width: 30,
      height: 30,
    };

    for (const pipe of this.pipes) {
      const pipeRect: Rect = {
        x: pipe.x,
        y: pipe.y,
        width: pipe.width,
        height: pipe.height,
      };
      if (Collision.rectIntersect(birdRect, pipeRect)) {
        this.endGame();
        return;
      }
    }
  }

  private checkBounds(): void {
    if (this.bird.y > 600 || this.bird.y < 0) {
      this.endGame();
    }
  }

  private endGame(): void {
    this.gameOver = true;
    flappyLogger.info('Game Over! Score: %d', this.score);
  }

  private restart(): void {
    for (const pipe of this.pipes) {
      pipe.removeFromParent();
    }
    this.pipes = [];
    this.bird.y = 300;
    this.birdVelocity = 0;
    this.score = 0;
    this.gameOver = false;
    this.started = false;
    this.lastPipeTime = 0;
  }

  protected draw(renderer: Renderer): void {
    const ctx = renderer.ctx;
    ctx.fillStyle = '#4ec0ca';
    ctx.fillRect(0, 0, 400, 600);

    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(this.bird.x - 15, this.bird.y - 15, 30, 30);

    ctx.fillStyle = '#2ecc71';
    for (const pipe of this.pipes) {
      ctx.fillRect(pipe.x, pipe.y, pipe.width, pipe.height);
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Score: ${this.score}`, 200, 50);

    if (!this.started) {
      ctx.fillText('Tap to Start', 200, 300);
    } else if (this.gameOver) {
      ctx.fillText('Game Over', 200, 280);
      ctx.fillText('Tap to Restart', 200, 320);
    }
  }
}
