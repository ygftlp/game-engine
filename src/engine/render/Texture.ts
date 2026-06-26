// 纹理：包装平台图片对象，记录尺寸。可通过 frame 描述图集中的子区域。
import { IImage } from '../platform/Platform';

/** 图集中的矩形子区域（像素）。 */
export interface TextureFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class Texture {
  loaded: boolean;

  constructor(public readonly image: IImage, loaded = true) {
    this.loaded = loaded;
  }

  get width(): number {
    return this.image.width;
  }

  get height(): number {
    return this.image.height;
  }
}
