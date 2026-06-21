import { describe, expect, it } from 'vitest';
import { Engine } from '../src/engine/Engine';
import { Input } from '../src/engine/input/Input';
import { Loader } from '../src/engine/loader/Loader';
import { Node } from '../src/engine/core/Node';
import { Scene } from '../src/engine/core/Scene';
import { Storage } from '../src/engine/utils/Storage';
import { Button } from '../src/engine/ui/Button';
import { UIManager } from '../src/engine/ui/UIManager';

describe('critical regressions', () => {
  it('keeps persistent UI listeners after scene-level listener cleanup', () => {
    let startHandler: ((points: Array<{ id: number; x: number; y: number }>) => void) | undefined;
    let moveHandler: ((points: Array<{ id: number; x: number; y: number }>) => void) | undefined;
    let endHandler: ((points: Array<{ id: number; x: number; y: number }>) => void) | undefined;

    const input = new Input(
      {
        onPointerStart(handler) {
          startHandler = handler;
        },
        onPointerMove(handler) {
          moveHandler = handler;
        },
        onPointerEnd(handler) {
          endHandler = handler;
        },
      } as any,
      1
    );

    const ui = new UIManager(input);
    const button = new Button('tap', 100, 40);
    let clicks = 0;
    button.onClickCallback = () => {
      clicks++;
    };
    ui.addWidget(button);

    startHandler?.([{ id: 1, x: 0, y: 0 }]);
    moveHandler?.([{ id: 1, x: 0, y: 0 }]);
    endHandler?.([{ id: 1, x: 0, y: 0 }]);
    expect(clicks).toBe(1);

    input.removeAllListeners();

    startHandler?.([{ id: 1, x: 0, y: 0 }]);
    moveHandler?.([{ id: 1, x: 0, y: 0 }]);
    endHandler?.([{ id: 1, x: 0, y: 0 }]);
    expect(clicks).toBe(2);
  });

  it('re-sorts children when zIndex changes after first access', () => {
    const parent = new Node();
    const low = new Node();
    const high = new Node();
    low.width = high.width = 20;
    low.height = high.height = 20;
    low.zIndex = 0;
    high.zIndex = 10;
    parent.addChild(low);
    parent.addChild(high);

    expect(parent.hitTest(0, 0)).toBe(high);

    high.zIndex = -10;

    expect(parent.hitTest(0, 0)).toBe(low);
  });

  it('uses zIndex rather than insertion order for UI hit testing', () => {
    let startHandler: ((points: Array<{ id: number; x: number; y: number }>) => void) | undefined;
    let endHandler: ((points: Array<{ id: number; x: number; y: number }>) => void) | undefined;

    const input = new Input(
      {
        onPointerStart(handler) {
          startHandler = handler;
        },
        onPointerMove() {},
        onPointerEnd(handler) {
          endHandler = handler;
        },
      } as any,
      1
    );

    const ui = new UIManager(input);
    const top = new Button('top', 100, 40);
    const bottom = new Button('bottom', 100, 40);
    let topClicks = 0;
    let bottomClicks = 0;

    top.zIndex = 10;
    bottom.zIndex = 0;
    top.onClickCallback = () => {
      topClicks++;
    };
    bottom.onClickCallback = () => {
      bottomClicks++;
    };

    ui.addWidget(top);
    ui.addWidget(bottom);

    startHandler?.([{ id: 1, x: 0, y: 0 }]);
    endHandler?.([{ id: 1, x: 0, y: 0 }]);

    expect(topClicks).toBe(1);
    expect(bottomClicks).toBe(0);
  });

  it('clears only namespaced storage keys', () => {
    const store = new Map<string, string>();
    const platform = {
      setStorage(key: string, value: string) {
        store.set(key, value);
      },
      getStorage(key: string) {
        return store.get(key) ?? null;
      },
      removeStorage(key: string) {
        store.delete(key);
      },
    };

    const storage = new Storage(platform as any, 'game_');
    storage.set('score', 100);
    platform.setStorage('auth_token', 'secret');

    storage.clear();

    expect(store.has('auth_token')).toBe(true);
    expect(store.has('game_score')).toBe(false);
  });

  it('fails loadAll when any resource load fails', async () => {
    const loader = new Loader(
      {
        createImage() {
          const image: Record<string, unknown> = {
            width: 10,
            height: 10,
            onload: null,
            onerror: null,
          };

          Object.defineProperty(image, 'src', {
            get() {
              return '';
            },
            set(value: string) {
              if (value === 'ok.png') {
                (image.onload as (() => void) | null)?.();
              } else {
                (image.onerror as ((err: unknown) => void) | null)?.(new Error('load failed'));
              }
            },
          });

          return image as any;
        },
        createAudio() {
          return {
            src: '',
            loop: false,
            volume: 1,
            play() {},
            pause() {},
            stop() {},
            destroy() {},
          };
        },
        requestJSON() {
          return Promise.resolve({});
        },
      } as any
    );

    await expect(
      loader.loadAll([
        { url: 'ok.png', type: 'texture' },
        { url: 'broken.png', type: 'texture' },
      ])
    ).rejects.toThrow(/resource\(s\) failed/i);
  });

  it('attaches the engine instance to scenes before entering them', () => {
    const engine = new Engine(
      {
        getScreenInfo() {
          return { width: 320, height: 240, pixelRatio: 1 };
        },
        createCanvas() {
          return {
            width: 0,
            height: 0,
            getContext() {
              return {
                fillRect() {},
                setTransform() {},
                save() {},
                restore() {},
                transform() {},
                fillText() {},
                clearRect() {},
                globalAlpha: 1,
                fillStyle: '#000000',
              } as any;
            },
          };
        },
        createImage() {
          return { src: '', width: 0, height: 0, onload: null, onerror: null };
        },
        createAudio() {
          return {
            src: '',
            loop: false,
            volume: 1,
            play() {},
            pause() {},
            stop() {},
            destroy() {},
          };
        },
        onPointerStart() {},
        onPointerMove() {},
        onPointerEnd() {},
        requestJSON() {
          return Promise.resolve({});
        },
        requestAnimationFrame() {
          return 0;
        },
        setStorage() {},
        getStorage() {
          return null;
        },
        removeStorage() {},
        clearStorage() {},
      } as any
    );

    const scene = new Scene();
    engine.setScene(scene);

    expect((scene as Scene & { engine?: Engine }).engine).toBe(engine);
  });
});
