// 精灵：可显示纹理的节点。以锚点(anchorX, anchorY)为中心绘制。
import { Node } from '../core/Node';
import { Renderer } from './Renderer';
import { Texture } from './Texture';

export class Sprite extends Node {
  width: number;
  height: number;
  anchorX = 0.5;
  anchorY = 0.5;

  constructor(public texture: Texture | null = null) {
    super();
    this.width = texture ? texture.width : 0;
    this.height = texture ? texture.height : 0;
  }

  protected draw(renderer: Renderer): void {
    if (!this.texture) return;
    const ox = -this.width * this.anchorX;
    const oy = -this.height * this.anchorY;
    renderer.ctx.drawImage(
      this.texture.image as unknown as CanvasImageSource,
      ox,
      oy,
      this.width,
      this.height
    );
  }
}
