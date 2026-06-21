import { afterEach, describe, expect, it } from 'vitest';
import { Collision } from '../src/engine/collision/Collision';
import { Loader } from '../src/engine/loader/Loader';
import { Renderer } from '../src/engine/render/Renderer';
import { Logger, LogLevel } from '../src/engine/utils/Logger';

type StorageMap = Map<string, string>;

function createStoragePlatform(store: StorageMap) {
  return {
    setStorage(key: string, value: string) {
      store.set(key, value);
    },
    getStorage(key: string) {
      return store.get(key) ?? null;
    }
  };
}

function createCanvasContext(): CanvasRenderingContext2D {
  return {
    fillRect() {},
    strokeRect() {},
    fillText() {},
    setTransform() {},
    save() {},
    restore() {},
    beginPath() {},
    clip() {},
    rect() {},
    stroke() {},
    transform() {},
    fillStyle: '#000000',
    strokeStyle: '#000000',
    lineWidth: 1,
    font: '12px monospace',
    textAlign: 'left',
    textBaseline: 'top',
    globalAlpha: 1
  } as unknown as CanvasRenderingContext2D;
}

afterEach(async () => {
  await Logger.flush();
  Logger.resetForTests();
});

describe('Logger', () => {
  it('writes formatted logs to panel and local log file asynchronously', async () => {
    const store = new Map<string, string>();
    Logger.attachPlatform(createStoragePlatform(store));
    Logger.configure({
      development: true,
      level: LogLevel.DEBUG,
      stackLevel: LogLevel.DEBUG,
      console: { enabled: false },
      file: { enabled: true, storageKey: 'test.log', maxChars: 4096 },
      panel: { enabled: true, maxEntries: 8 }
    });

    const moduleLogger = Logger.forModule('UnitTest');
    moduleLogger.debug('player=%s state=%o', 'alice', { hp: 100, tags: ['hero'] });

    expect(Logger.getPanelLines()).toHaveLength(0);

    await Logger.flush();

    const panelLines = Logger.getPanelLines();
    const persisted = store.get('test.log') ?? '';

    expect(panelLines).toHaveLength(1);
    expect(panelLines[0]).toContain('[DEBUG] [UnitTest] player=alice');
    expect(panelLines[0]).toContain('state={ hp: 100, tags: [hero] }');
    expect(persisted).toContain('[DEBUG] [UnitTest] player=alice');
    expect(persisted).toMatch(/Logger\.test/);
  });

  it('suppresses debug logs in production mode', async () => {
    const store = new Map<string, string>();
    Logger.attachPlatform(createStoragePlatform(store));
    Logger.configure({
      development: false,
      level: LogLevel.DEBUG,
      console: { enabled: false },
      file: { enabled: true, storageKey: 'prod.log', maxChars: 2048 },
      panel: { enabled: true, maxEntries: 8 }
    });

    const moduleLogger = Logger.forModule('Prod');
    moduleLogger.debug('hidden debug');
    moduleLogger.info('visible info');

    await Logger.flush();

    expect(Logger.getPanelLines()).toHaveLength(1);
    expect(Logger.getPanelLines()[0]).toContain('[INFO] [Prod] visible info');
    expect(store.get('prod.log')).not.toContain('hidden debug');
  });

  it('logs renderer, physics and network paths through the new module loggers', async () => {
    const store = new Map<string, string>();
    Logger.attachPlatform(createStoragePlatform(store));
    Logger.configure({
      development: true,
      level: LogLevel.DEBUG,
      stackLevel: LogLevel.FATAL,
      console: { enabled: false },
      file: { enabled: false },
      panel: { enabled: true, maxEntries: 12 }
    });

    new Renderer(
      {
        width: 0,
        height: 0,
        getContext() {
          return createCanvasContext();
        }
      },
      320,
      180
    );

    Collision.rectIntersect(
      { x: Number.NaN, y: 0, width: 10, height: 10 },
      { x: 0, y: 0, width: 10, height: 10 }
    );

    const loader = new Loader({
      createImage() {
        throw new Error('unused');
      },
      createAudio() {
        throw new Error('unused');
      },
      requestJSON() {
        return Promise.resolve({ ok: true });
      }
    } as never);

    await loader.loadJSON('https://example.com/config.json');
    await Logger.flush();

    const panel = Logger.getPanelLines().join('\n');
    expect(panel).toContain('[DEBUG] [Renderer] renderer ready');
    expect(panel).toContain('[WARNING] [Physics] rectIntersect received invalid rect');
    expect(panel).toContain('[DEBUG] [Network] requestJSON start');
    expect(panel).toContain('[DEBUG] [Network] requestJSON success');
  });
});
