import { describe, expect, it } from 'vitest';
import { Loader } from './Loader';
import { IAudio, ICanvas, IImage, IPlatform, PointerHandler, ScreenInfo } from '../platform/Platform';

class JSONPlatformMock implements IPlatform {
  readonly name = 'test';
  requestCount = 0;

  constructor(private readonly value: unknown) {}

  createCanvas(): ICanvas {
    throw new Error('createCanvas is not used in this test');
  }

  createImage(): IImage {
    throw new Error('createImage is not used in this test');
  }

  createAudio(): IAudio {
    throw new Error('createAudio is not used in this test');
  }

  getScreenInfo(): ScreenInfo {
    return { width: 320, height: 568, pixelRatio: 1 };
  }

  onPointerStart(_handler: PointerHandler): void {
    return;
  }

  onPointerMove(_handler: PointerHandler): void {
    return;
  }

  onPointerEnd(_handler: PointerHandler): void {
    return;
  }

  async requestJSON(_url: string): Promise<unknown> {
    this.requestCount += 1;
    return this.value;
  }

  requestAnimationFrame(_cb: (time: number) => void): number {
    return 0;
  }

  getStorage(_key: string): string | null {
    return null;
  }

  setStorage(_key: string, _value: string): void {
    return;
  }

  removeStorage(_key: string): void {
    return;
  }
}

describe('Loader', () => {
  it.each([false, null, 0, ''])('caches falsy JSON value %j', async (value) => {
    const platform = new JSONPlatformMock(value);
    const loader = new Loader(platform);

    await expect(loader.loadJSON('config.json')).resolves.toBe(value);
    await expect(loader.loadJSON('config.json')).resolves.toBe(value);

    expect(platform.requestCount).toBe(1);
  });
});
