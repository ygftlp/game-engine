import { defineConfig } from 'vitest/config';

// Frozen lite-game-engine test suite (legacy/). Not part of the default
// gate; kept runnable so the frozen code keeps an honest safety net.
export default defineConfig({
  define: {
    __DEV__: 'true',
    __APP_ENV__: '"development"',
  },
  test: {
    include: ['legacy/tests/**/*.test.ts', 'legacy/engine/**/*.test.ts'],
  },
});
