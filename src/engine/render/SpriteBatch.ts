// 渲染批处理：将相同纹理的 Sprite 合并为一次 drawImage 调用，减少 Canvas 状态切换。
import { Renderer } from './Renderer';
import { Sprite } from './Sprite';

/** 批处理绘制单元 */
interface BatchEntry {
  sprite: Sprite;
  img: CanvasImageSource;
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  dx: number;
  dy: number;
  dw: number;
  dh: number;
  alpha: number;
}

/**
 * SpriteBatch 将相同纹理的 Sprite 合并绘制。
 * 使用方式：
 *   const batch = new SpriteBatch(renderer);
 *   batch.begin();
 *   sprites.forEach(s => batch.addSprite(s));
 *   batch.flush();
 *   batch.end();
 */
export class SpriteBatch {
  private renderer: Renderer;
  private entries: BatchEntry[] = [];

  constructor(renderer: Renderer) {
    this.renderer = renderer;
  }

  /** 开始收集绘制命令。 */
  begin(): void {
    this.entries.length = 0;
  }

  /** 添加一个 Sprite 到批处理队列。 */
  addSprite(sprite: Sprite): void {
    if (!sprite.texture || !sprite.texture.loaded) return;
    if (!sprite.visible || sprite.alpha <= 0) return;

    const img = sprite.texture.image as unknown as CanvasImageSource;
    const ox = -sprite.width * sprite.anchorX;
    const oy = -sprite.height * sprite.anchorY;

    let sx: number, sy: number, sw: number, sh: number;
    if (sprite.frame) {
      sx = sprite.frame.x;
      sy = sprite.frame.y;
      sw = sprite.frame.width;
      sh = sprite.frame.height;
    } else {
      sx = 0;
      sy = 0;
      sw = sprite.texture.width;
      sh = sprite.texture.height;
    }

    this.entries.push({
      sprite,
      img,
      sx, sy, sw, sh,
      dx: ox, dy: oy,
      dw: sprite.width, dh: sprite.height,
      alpha: sprite.alpha,
    });
  }

  /** 将收集的绘制命令一次性提交到 Canvas。 */
  flush(): void {
    if (this.entries.length === 0) return;

    const ctx = this.renderer.ctx;
    ctx.save();

    let lastAlpha = -1;

    for (const entry of this.entries) {
      const wm = entry.sprite.worldMatrix;
      ctx.setTransform(wm.a, wm.b, wm.c, wm.d, wm.e, wm.f);

      if (entry.alpha !== lastAlpha) {
        ctx.globalAlpha = entry.alpha;
        lastAlpha = entry.alpha;
      }

      if (entry.sw === entry.dw && entry.sh === entry.dh) {
        ctx.drawImage(entry.img, entry.dx, entry.dy);
      } else {
        ctx.drawImage(
          entry.img,
          entry.sx, entry.sy, entry.sw, entry.sh,
          entry.dx, entry.dy, entry.dw, entry.dh
        );
      }
    }

    ctx.restore();
    this.entries.length = 0;
  }

  /** 结束批处理。 */
  end(): void {
    if (this.entries.length > 0) {
      this.flush();
    }
  }

  /** 当前队列中的 Sprite 数量。 */
  get size(): number {
    return this.entries.length;
  }
}
