// 打砖块游戏场景：动作类游戏Demo，展示碰撞检测和物理模拟。
import { Scene, Node, Collision, Rect, Engine, Renderer, TouchPoint } from '../../../engine';

type SceneWithEngine = BreakoutScene & { engine?: Engine };

const PADDLE_WIDTH = 80;
const PADDLE_HEIGHT = 15;
const BALL_SIZE = 12;
const BALL_SPEED = 300;
const BRICK_ROWS = 5;
const BRICK_COLS = 8;
const BRICK_WIDTH = 45;
const BRICK_HEIGHT = 20;
const BRICK_GAP = 3;

export class BreakoutScene extends Scene {
  private paddle!: Node;
  private ball!: Node;
  private ballVx = 0;
  private ballVy = 0;
  private bricks: Node[] = [];
  private score = 0;
  private gameOver = false;
  private gameWon = false;
  private started = false;

  onEnter(): void {
    this.setupPaddle();
    this.setupBall();
    this.setupBricks();
    this.setupInput();
  }

  private setupPaddle(): void {
    this.paddle = new Node();
    this.paddle.x = 200;
    this.paddle.y = 550;
    this.paddle.width = PADDLE_WIDTH;
    this.paddle.height = PADDLE_HEIGHT;
    this.addChild(this.paddle);
  }

  private setupBall(): void {
    this.ball = new Node();
    this.ball.x = 200;
    this.ball.y = 530;
    this.ball.width = BALL_SIZE;
    this.ball.height = BALL_SIZE;
    this.addChild(this.ball);
  }

  private setupBricks(): void {
    const startX = (400 - (BRICK_COLS * (BRICK_WIDTH + BRICK_GAP) - BRICK_GAP)) / 2;
    for (let row = 0; row < BRICK_ROWS; row++) {
      for (let col = 0; col < BRICK_COLS; col++) {
        const brick = new Node();
        brick.x = startX + col * (BRICK_WIDTH + BRICK_GAP) + BRICK_WIDTH / 2;
        brick.y = 50 + row * (BRICK_HEIGHT + BRICK_GAP) + BRICK_HEIGHT / 2;
        brick.width = BRICK_WIDTH;
        brick.height = BRICK_HEIGHT;
        this.addChild(brick);
        this.bricks.push(brick);
      }
    }
  }

  private setupInput(): void {
    const engine = (this as SceneWithEngine).engine;
    if (!engine || !engine.input) return;

    engine.input.onMove((touches: TouchPoint[]) => {
      if (touches.length > 0) {
        this.paddle.x = Math.max(PADDLE_WIDTH / 2, Math.min(400 - PADDLE_WIDTH / 2, touches[0].x));
      }
    });

    engine.input.onStart(() => {
      if (this.gameOver || this.gameWon) {
        this.restart();
        return;
      }
      if (!this.started) {
        this.started = true;
        this.ballVx = BALL_SPEED * (Math.random() > 0.5 ? 1 : -1);
        this.ballVy = -BALL_SPEED;
      }
    });
  }

  update(dt: number): void {
    if (!this.started || this.gameOver || this.gameWon) return;

    this.ball.x += this.ballVx * dt;
    this.ball.y += this.ballVy * dt;

    this.checkWallCollision();
    this.checkPaddleCollision();
    this.checkBrickCollision();
    this.checkGameOver();
  }

  private checkWallCollision(): void {
    if (this.ball.x <= BALL_SIZE / 2 || this.ball.x >= 400 - BALL_SIZE / 2) {
      this.ballVx = -this.ballVx;
    }
    if (this.ball.y <= BALL_SIZE / 2) {
      this.ballVy = -this.ballVy;
    }
  }

  private checkPaddleCollision(): void {
    const ballRect: Rect = {
      x: this.ball.x - BALL_SIZE / 2,
      y: this.ball.y - BALL_SIZE / 2,
      width: BALL_SIZE,
      height: BALL_SIZE,
    };
    const paddleRect: Rect = {
      x: this.paddle.x - PADDLE_WIDTH / 2,
      y: this.paddle.y - PADDLE_HEIGHT / 2,
      width: PADDLE_WIDTH,
      height: PADDLE_HEIGHT,
    };

    if (Collision.rectIntersect(ballRect, paddleRect)) {
      this.ballVy = -Math.abs(this.ballVy);
      const hitPos = (this.ball.x - this.paddle.x) / (PADDLE_WIDTH / 2);
      this.ballVx = BALL_SPEED * hitPos;
    }
  }

  private checkBrickCollision(): void {
    const ballRect: Rect = {
      x: this.ball.x - BALL_SIZE / 2,
      y: this.ball.y - BALL_SIZE / 2,
      width: BALL_SIZE,
      height: BALL_SIZE,
    };

    for (let i = this.bricks.length - 1; i >= 0; i--) {
      const brick = this.bricks[i];
      const brickRect: Rect = {
        x: brick.x - BRICK_WIDTH / 2,
        y: brick.y - BRICK_HEIGHT / 2,
        width: BRICK_WIDTH,
        height: BRICK_HEIGHT,
      };

      if (Collision.rectIntersect(ballRect, brickRect)) {
        this.ballVy = -this.ballVy;
        brick.removeFromParent();
        this.bricks.splice(i, 1);
        this.score += 10;
        break;
      }
    }
  }

  private checkGameOver(): void {
    if (this.ball.y > 600) {
      this.gameOver = true;
    }
    if (this.bricks.length === 0) {
      this.gameWon = true;
    }
  }

  private restart(): void {
    for (const brick of this.bricks) {
      brick.removeFromParent();
    }
    this.bricks = [];
    this.setupBricks();
    this.ball.x = 200;
    this.ball.y = 530;
    this.ballVx = 0;
    this.ballVy = 0;
    this.score = 0;
    this.gameOver = false;
    this.gameWon = false;
    this.started = false;
  }

  protected draw(renderer: Renderer): void {
    const ctx = renderer.ctx;
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, 400, 600);

    ctx.fillStyle = '#e94560';
    ctx.fillRect(
      this.paddle.x - PADDLE_WIDTH / 2,
      this.paddle.y - PADDLE_HEIGHT / 2,
      PADDLE_WIDTH,
      PADDLE_HEIGHT
    );

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(this.ball.x, this.ball.y, BALL_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();

    const colors = ['#0f3460', '#16213e', '#1a1a2e', '#533483', '#e94560'];
    for (let i = 0; i < this.bricks.length; i++) {
      const brick = this.bricks[i];
      const row = Math.floor(i / BRICK_COLS);
      ctx.fillStyle = colors[row % colors.length];
      ctx.fillRect(
        brick.x - BRICK_WIDTH / 2,
        brick.y - BRICK_HEIGHT / 2,
        BRICK_WIDTH,
        BRICK_HEIGHT
      );
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Score: ${this.score}`, 200, 30);

    if (!this.started) {
      ctx.fillText('Tap to Start', 200, 300);
    } else if (this.gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, 400, 600);
      ctx.fillStyle = '#ffffff';
      ctx.font = '32px sans-serif';
      ctx.fillText('Game Over', 200, 280);
      ctx.font = '20px sans-serif';
      ctx.fillText('Tap to Restart', 200, 320);
    } else if (this.gameWon) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, 400, 600);
      ctx.fillStyle = '#ffffff';
      ctx.font = '32px sans-serif';
      ctx.fillText('You Win!', 200, 280);
      ctx.font = '20px sans-serif';
      ctx.fillText('Tap to Restart', 200, 320);
    }
  }
}
