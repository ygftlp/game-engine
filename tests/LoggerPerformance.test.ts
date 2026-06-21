import { describe, expect, it } from 'vitest';
import { Logger, LogLevel } from '../src/engine/utils/Logger';

function createStoragePlatform() {
  const store = new Map<string, string>();
  return {
    store,
    platform: {
      setStorage(key: string, value: string) {
        store.set(key, value);
      },
      getStorage(key: string) {
        return store.get(key) ?? null;
      }
    }
  };
}

function runFrameWorkload(frames: number, withLogs: boolean): number {
  const systemLogger = Logger.forModule('Perf');
  const start = performance.now();

  for (let frame = 0; frame < frames; frame++) {
    let energy = 0;
    for (let i = 0; i < 240000; i++) {
      energy += Math.sin((frame + i) * 0.01) * Math.cos(i * 0.015);
    }
    if (withLogs) {
      systemLogger.debug('frame=%d energy=%d', frame, energy);
    }
  }

  return performance.now() - start;
}

function averageDuration(frames: number, withLogs: boolean, rounds: number): number {
  let total = 0;
  for (let i = 0; i < rounds; i++) {
    total += runFrameWorkload(frames, withLogs);
  }
  return total / rounds;
}

describe('Logger performance', () => {
  it('keeps simulated main-thread overhead within 5% with full debug logging enabled', async () => {
    const { platform } = createStoragePlatform();
    Logger.attachPlatform(platform);
    Logger.configure({
      development: true,
      level: LogLevel.DEBUG,
      stackLevel: LogLevel.FATAL,
      console: { enabled: false },
      file: { enabled: true, storageKey: 'perf.log', maxChars: 64 * 1024 },
      panel: { enabled: true, maxEntries: 32 }
    });

    runFrameWorkload(12, false);
    runFrameWorkload(12, true);

    const baseline = averageDuration(60, false, 2);
    const withDebug = averageDuration(60, true, 2);
    await Logger.flush();

    const overheadRatio = (withDebug - baseline) / baseline;
    console.log(
      `[logger-perf] baseline=${baseline.toFixed(2)}ms withDebug=${withDebug.toFixed(2)}ms overhead=${(
        overheadRatio * 100
      ).toFixed(2)}%`
    );
    expect(overheadRatio).toBeLessThanOrEqual(0.05);
  });
});
