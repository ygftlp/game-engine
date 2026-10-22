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
  private _image: IImage | null;

  constructor(image: IImage, loaded = true) {
    this._image = image;
    this.loaded = loaded;
  }

  get image(): IImage {
    if (!this._image) throw new Error('Texture has been disposed');
    return this._image;
  }

  get width(): number {
    return this.image.width;
  }

  get height(): number {
    return this.image.height;
  }

  dispose(): void {
    if (this._image && 'src' in this._image) {
      (this._image as any).src = '';
    }
    this._image = null;
    this.loaded = false;
  }
}
