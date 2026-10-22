# Troubleshooting Guide

## Performance Bottlenecks

### Symptom: frame drops or input lag

Checklist:

1. verify you are not allocating many objects inside `draw()`
2. confirm repeated resources are hitting the loader cache
3. inspect node count and how often `zIndex` changes
4. use browser devtools or mini-game performance tools to inspect main-thread time
5. check the logger panel for repeated load failures or retries

Recommended fixes:

- reuse high-frequency objects
- preload assets in batches
- reduce per-frame string building and excessive logging
- use layered collision or `SpatialGrid` for larger worlds

## Rendering Issues

### Symptom: node exists but is not visible

Verify:

- `visible` is not `false`
- `alpha` is greater than `0`
- `width` and `height` are initialized when hit testing matters
- `draw()` actually emits canvas commands
- the parent node was not hidden or destroyed

### Symptom: draw order looks wrong

Check:

- correct `zIndex` values
- runtime `zIndex` mutations
- whether UI hit testing is routed through `UIManager`

The engine already re-sorts cached child order when `zIndex` changes, but game code still needs a clean layer design.

## Script Issues

### Symptom: interaction stops after a scene switch

Steps:

1. check whether the listener is scene-level or system-level
2. use `persistent` listeners for long-lived UI systems
3. ensure scene-specific listeners are re-registered when a new scene enters

### Symptom: `update()` never runs

Check:

- `engine.start()` was called
- the scene entered through `setScene()` or `pushScene()`
- overridden `update(dt)` still calls `super.update(dt)` when child updates are needed

## Resource Loading Failures

### Symptom: `loadTexture()` or `loadJSON()` throws

Steps:

1. validate the final runtime URL
2. check that the target platform allows access to the asset
3. ensure the local static server serves the right folder
4. inspect the `Network` logger output

### Symptom: batch loading appears successful but some assets are missing

The current `loadAll()` rejects when any task fails. If this still slips through, the most common cause is swallowed Promise errors in game code. Use:

```ts
try {
  await engine.loader.loadAll(tasks, onProgress);
} catch (error) {
  logger.error('preload failed: %o', error);
}
```

## Input Issues

### Symptom: UI tap positions are offset

Steps:

1. compare canvas CSS scale and internal logical resolution
2. verify the platform `pixelRatio`
3. make sure game code is not scaling touch points a second time

`Input` already converts host points into engine-space coordinates.

## Audio Issues

### Symptom: background music does not play

Steps:

1. verify the asset path
2. check whether the host requires a user gesture before playback
3. confirm the audio object was not destroyed too early

Recommended fix:

- trigger `audio.play()` after the first user interaction

## Storage Issues

### Symptom: `Storage.clear()` removes unrelated data

The current version already scopes `clear()` to the active namespace. If you still see data loss, check:

- whether multiple systems share the same prefix
- whether platform-level `clearStorage()` is being called directly

## Diagnostic Tools

### Logger panel

Useful for:

- development-time module logs
- resource request failures
- rendering and collision warnings

### Browser devtools

Useful for:

- frame timing
- memory snapshots
- network inspection
- console exceptions

### Mini-game devtools

Useful for:

- platform API behavior
- device compatibility
- local storage inspection
- package and asset loading

## Pre-release Checklist

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run verify:prod-logs
npm run docs:build
```

## When to Extend the Engine

If your project needs any of the following, extend the engine deliberately instead of forcing the current lightweight API beyond its intended scope:

- large-scale skeletal animation
- rigid-body physics with constraints
- advanced shaders or a 3D pipeline
- online state replication and networking
