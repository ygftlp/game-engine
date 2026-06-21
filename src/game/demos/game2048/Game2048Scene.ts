// 2048 游戏场景：益智类游戏Demo，展示输入处理和游戏逻辑。
import { Scene, Node, Vec2, Engine, Renderer, TouchPoint } from '../../../engine';

const GRID_SIZE = 4;
const CELL_SIZE = 80;
const CELL_GAP = 10;
const GRID_OFFSET = 40;

interface Cell {
  value: number;
  node: Node;
}

type SceneWithEngine = Game2048Scene & { engine?: Engine };

export class Game2048Scene extends Scene {
  private grid: (Cell | null)[][] = [];
  private score = 0;
  private gameOver = false;

  onEnter(): void {
    this.initGrid();
    this.setupInput();
    this.spawnTile();
    this.spawnTile();
  }

  private initGrid(): void {
    this.grid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
  }

  private setupInput(): void {
    const engine = (this as SceneWithEngine).engine;
    if (!engine || !engine.input) return;

    let startX = 0;
    let startY = 0;

    engine.input.onStart((touches: TouchPoint[]) => {
      if (touches.length > 0) {
        startX = touches[0].x;
        startY = touches[0].y;
      }
    });

    engine.input.onEnd((touches: TouchPoint[]) => {
      if (this.gameOver || touches.length === 0) return;

      const endX = touches[0].x;
      const endY = touches[0].y;
      const dx = endX - startX;
      const dy = endY - startY;

      if (Math.abs(dx) < 30 && Math.abs(dy) < 30) return;

      if (Math.abs(dx) > Math.abs(dy)) {
        this.move(dx > 0 ? 'right' : 'left');
      } else {
        this.move(dy > 0 ? 'down' : 'up');
      }
    });
  }

  private spawnTile(): void {
    const emptyCells: Vec2[] = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (!this.grid[r][c]) {
          emptyCells.push(new Vec2(r, c));
        }
      }
    }
    if (emptyCells.length === 0) return;

    const pos = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const value = Math.random() < 0.9 ? 2 : 4;
    const node = new Node();
    node.x = GRID_OFFSET + pos.y * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2;
    node.y = GRID_OFFSET + pos.x * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2;
    node.width = CELL_SIZE;
    node.height = CELL_SIZE;
    this.addChild(node);
    this.grid[pos.x][pos.y] = { value, node };
  }

  private move(direction: string): void {
    let moved = false;
    const merged = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false));

    const getCell = (r: number, c: number) => this.grid[r][c];
    const setCell = (r: number, c: number, cell: Cell | null) => {
      this.grid[r][c] = cell;
      if (cell) {
        cell.node.x = GRID_OFFSET + c * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2;
        cell.node.y = GRID_OFFSET + r * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2;
      }
    };

    const processCell = (r: number, c: number, dr: number, dc: number) => {
      const cell = getCell(r, c);
      if (!cell) return;

      let newR = r;
      let newC = c;
      let searching = true;
      while (searching) {
        const nextR = newR + dr;
        const nextC = newC + dc;
        if (nextR < 0 || nextR >= GRID_SIZE || nextC < 0 || nextC >= GRID_SIZE) break;
        const next = getCell(nextR, nextC);
        if (!next) {
          newR = nextR;
          newC = nextC;
        } else if (next.value === cell.value && !merged[nextR][nextC]) {
          newR = nextR;
          newC = nextC;
          searching = false;
        } else {
          searching = false;
        }
      }

      if (newR !== r || newC !== c) {
        const target = getCell(newR, newC);
        if (target && target.value === cell.value) {
          target.value *= 2;
          this.score += target.value;
          cell.node.removeFromParent();
          merged[newR][newC] = true;
        } else {
          setCell(newR, newC, cell);
        }
        setCell(r, c, null);
        moved = true;
      }
    };

    if (direction === 'up') {
      for (let r = 1; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          processCell(r, c, -1, 0);
        }
      }
    } else if (direction === 'down') {
      for (let r = GRID_SIZE - 2; r >= 0; r--) {
        for (let c = 0; c < GRID_SIZE; c++) {
          processCell(r, c, 1, 0);
        }
      }
    } else if (direction === 'left') {
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 1; c < GRID_SIZE; c++) {
          processCell(r, c, 0, -1);
        }
      }
    } else if (direction === 'right') {
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = GRID_SIZE - 2; c >= 0; c--) {
          processCell(r, c, 0, 1);
        }
      }
    }

    if (moved) {
      this.spawnTile();
      this.checkGameOver();
    }
  }

  private checkGameOver(): void {
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (!this.grid[r][c]) return;
        const val = this.grid[r][c]!.value;
        if (r < GRID_SIZE - 1 && this.grid[r + 1][c]?.value === val) return;
        if (c < GRID_SIZE - 1 && this.grid[r][c + 1]?.value === val) return;
      }
    }
    this.gameOver = true;
  }

  protected draw(renderer: Renderer): void {
    const ctx = renderer.ctx;
    ctx.fillStyle = '#bbada0';
    ctx.fillRect(0, 0, 400, 600);

    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const x = GRID_OFFSET + c * (CELL_SIZE + CELL_GAP);
        const y = GRID_OFFSET + r * (CELL_SIZE + CELL_GAP);
        ctx.fillStyle = '#cdc1b4';
        ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);

        const cell = this.grid[r][c];
        if (cell) {
          ctx.fillStyle = this.getCellColor(cell.value);
          ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
          ctx.fillStyle = cell.value <= 4 ? '#776e65' : '#f9f6f2';
          ctx.font = 'bold 24px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(cell.value), x + CELL_SIZE / 2, y + CELL_SIZE / 2);
        }
      }
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Score: ${this.score}`, 200, 560);

    if (this.gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, 400, 600);
      ctx.fillStyle = '#ffffff';
      ctx.font = '32px sans-serif';
      ctx.fillText('Game Over', 200, 280);
      ctx.font = '20px sans-serif';
      ctx.fillText('Tap to Restart', 200, 320);
    }
  }

  private getCellColor(value: number): string {
    const colors: Record<number, string> = {
      2: '#eee4da',
      4: '#ede0c8',
      8: '#f2b179',
      16: '#f59563',
      32: '#f67c5f',
      64: '#f65e3b',
      128: '#edcf72',
      256: '#edcc61',
      512: '#edc850',
      1024: '#edc53f',
      2048: '#edc22e',
    };
    return colors[value] || '#3c3a32';
  }
}
