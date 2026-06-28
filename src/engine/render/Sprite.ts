// 精灵：可显示纹理的节点。以锚点(anchorX, anchorY)为中心绘制。
// 支持从图集绘制子区域（frame），供帧动画使用。
import { Node } from '../core/Node';
import { Renderer } from './Renderer';
import { Texture, TextureFrame } from './Texture';

export class Sprite extends Node {
  /** 当前绘制的图集子区域；null 表示绘制整张纹理。 */
  frame: TextureFrame | null = null;

  constructor(public texture: Texture | null = null) {
    super();
    if (texture) {
      this.width = texture.width;
      this.height = texture.height;
    }
  }

  setTexture(texture: Texture, frame: TextureFrame | null = null): void {
    this.texture = texture;
    this.frame = frame;
    this.width = frame ? frame.width : texture.width;
    this.height = frame ? frame.height : texture.height;
  }

  setFrame(frame: TextureFrame): void {
    this.frame = frame;
    this.width = frame.width;
    this.height = frame.height;
  }

  protected draw(renderer: Renderer): void {
    if (!this.texture || !this.texture.loaded) return;
    const ox = -this.width * this.anchorX;
    const oy = -this.height * this.anchorY;
    const img = this.texture.image as unknown as CanvasImageSource;
    if (this.frame) {
      renderer.ctx.drawImage(
        img,
        this.frame.x,
        this.frame.y,
        this.frame.width,
        this.frame.height,
        ox,
        oy,
        this.width,
        this.height
      );
    } else {
      renderer.ctx.drawImage(img, ox, oy, this.width, this.height);
    }
  }
}
