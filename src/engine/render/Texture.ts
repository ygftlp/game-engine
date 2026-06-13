// 纹理：包装平台图片对象，记录尺寸。
import { IImage } from '../platform/Platform';

export class Texture {
  constructor(public readonly image: IImage) {}

  get width(): number {
    return this.image.width;
  }

  get height(): number {
    return this.image.height;
  }
}
