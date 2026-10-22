// 示例：使用 lite-game-engine 创建一个简单游戏
import { 
  Engine, 
  H5Platform, 
  Scene, 
  Node, 
  Collision, 
  Rect 
} from 'lite-game-engine';

// ==================== 游戏配置 ====================
const CONFIG = {
  width: 375,
  height: 667,
  playerSize: 40,
  targetSize: 50,
};

// ==================== 玩家节点 ====================
class Player extends Node {
  private dragging = false;

  constructor() {
    super();
    this.width = CONFIG.playerSize;
    this.height = CONFIG.playerSize;
    this.x = CONFIG.width / 2;
    this.y = CONFIG.height * 0.7;
  }

  startDrag(): void {
    this.dragging = true;
  }

  moveDrag(x: number, y: number): void {
    if (this.dragging) {
      this.x = x;
      this.y = y;
    }
  }

  endDrag(): void {
    this.dragging = false;
  }

  isDragging(): boolean {
    return this.dragging;
  }

  protected draw(renderer: any): void {
    const ctx = renderer.ctx;
    const size = CONFIG.playerSize;
    
    // 绘制玩家（蓝色方块）
    ctx.fillStyle = '#4ecdc4';
    ctx.fillRect(-size/2, -size/2, size, size);
    
    // 绘制边框
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(-size/2, -size/2, size, size);
  }
}

// ==================== 目标节点 ====================
class Target extends Node {
  constructor() {
    super();
    this.width = CONFIG.targetSize;
    this.height = CONFIG.targetSize;
    this.randomPosition();
  }

  randomPosition(): void {
    this.x = CONFIG.targetSize + Math.random() * (CONFIG.width - CONFIG.targetSize * 2);
    this.y = CONFIG.targetSize + Math.random() * (CONFIG.height - CONFIG.targetSize * 2);
  }

  protected draw(renderer: any): void {
    const ctx = renderer.ctx;
    const size = CONFIG.targetSize;
    
    // 绘制目标（绿色圆形）
    ctx.fillStyle = '#2ecc71';
    ctx.beginPath();
    ctx.arc(0, 0, size/2, 0, Math.PI * 2);
    ctx.fill();
    
    // 绘制边框
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

// ==================== 游戏场景 ====================
class GameScene extends Scene {
  private player!: Player;
  private target!: Target;
  private score = 0;

  onEnter(): void {
    // 创建玩家
    this.player = new Player();
    this.addChild(this.player);

    // 创建目标
    this.target = new Target();
    this.addChild(this.target);

    // 绑定输入事件
    this.setupInput();
  }

  private setupInput(): void {
    const engine = (this as any).engine as Engine;
    if (!engine) return;

    // 触摸/鼠标按下
    engine.input.onStart((touches) => {
      if (touches.length > 0) {
        const t = touches[0];
        const dx = t.x - this.player.x;
        const dy = t.y - this.player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < CONFIG.playerSize) {
          this.player.startDrag();
        }
      }
    });

    // 触摸/鼠标移动
    engine.input.onMove((touches) => {
      if (touches.length > 0) {
        this.player.moveDrag(touches[0].x, touches[0].y);
      }
    });

    // 触摸/鼠标抬起
    engine.input.onEnd(() => {
      this.player.endDrag();
    });
  }

  update(dt: number): void {
    super.update(dt);

    // 碰撞检测
    const playerRect: Rect = {
      x: this.player.x - CONFIG.playerSize / 2,
      y: this.player.y - CONFIG.playerSize / 2,
      width: CONFIG.playerSize,
      height: CONFIG.playerSize,
    };

    const targetRect: Rect = {
      x: this.target.x - CONFIG.targetSize / 2,
      y: this.target.y - CONFIG.targetSize / 2,
      width: CONFIG.targetSize,
      height: CONFIG.targetSize,
    };

    if (Collision.rectIntersect(playerRect, targetRect)) {
      this.score++;
      this.target.randomPosition();
    }
  }

  protected draw(renderer: any): void {
    const ctx = renderer.ctx;

    // 背景
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);

    // 绘制分数
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`分数: ${this.score}`, CONFIG.width / 2, 40);

    // 绘制提示
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#888';
    ctx.fillText('拖动蓝色方块碰到绿色圆形', CONFIG.width / 2, 70);
  }
}

// ==================== 启动游戏 ====================
const engine = new Engine(new H5Platform());
engine.setScene(new GameScene());
engine.start();