# Technical Architecture

## Overview

The engine follows a three-layer structure:

- Core layer: `Engine`, `Scene`, `Node`, `Renderer`, `Input`, `Loader`, `Audio`, `Collision`, `Logger`
- Platform adapter layer: `H5Platform`, `WxPlatform`, `TtPlatform`
- Game layer: project scenes, UI, demos, and platform entry files

The core layer never touches `wx`, `tt`, or `document` directly. Instead, it depends on `IPlatform`, which keeps the runtime portable across targets.

## Main Loop

`Engine` performs the following during construction:

1. Reads screen information and computes the internal resolution
2. Attaches logger sinks and development panel settings
3. Creates `Renderer`, `Input`, `Loader`, and `SceneManager`
4. Starts a unified frame loop through `Ticker`
5. Runs `update -> render` each frame

Rendering is driven by `Scene.visit()`, which traverses the node tree, updates world matrices, and draws in render order. Scene changes trigger input listener cleanup so stale listeners do not leak across scenes.

## Module Dependencies

| Module | Direct dependencies | Responsibility |
| --- | --- | --- |
| `Engine` | `IPlatform`, `Renderer`, `Input`, `Loader`, `SceneManager`, `Ticker` | lifecycle, frame loop, scene switching |
| `Renderer` | `ICanvas` | Canvas 2D draw wrapper |
| `Scene` / `Node` | `Matrix2D`, `Renderer` | hierarchy, transforms, rendering, hit testing |
| `Input` | `IPlatform` | normalize host pointer input |
| `UIManager` | `Input`, `Node` | UI hit testing and interaction |
| `Loader` | `IPlatform`, `Texture`, `Audio`, `LRUCache` | resource loading, caching, disposal |
| `Audio` | `IPlatform` | thin host audio wrapper |
| `Collision` | none | lightweight 2D collision helpers |
| `Logger` | optional storage subset from `IPlatform` | async logs, panel overlay, persistence |

## Rendering System

### Implementation

- The rendering backend is `CanvasRenderingContext2D`
- `Renderer.clear()` resets transform state and alpha before every frame
- `Node.visit()` composes local transforms with the parent world matrix and stores the result in `worldMatrix`
- Children are drawn in ascending `zIndex`, so visually higher layers are rendered later

### Data Flow

1. `Engine.render()` calls the active scene's `visit()`
2. `Node.visit()` computes and stores each node's world matrix
3. Subclasses emit draw commands inside `draw(renderer)`
4. `Logger.renderPanel()` overlays debug lines after the scene draw pass

### Performance Strategy

- Child sorting is cached and recomputed only when structure or `zIndex` changes
- Nodes with `visible = false` or `alpha <= 0` exit early
- Canvas state stacking is used instead of duplicating custom transform math everywhere

## Physics and Collision

The current engine does not include a rigid-body solver, a continuous collision system, or a global physics world. The real physics scope is:

- `Collision.rectIntersect()`
- `Collision.circleIntersect()`
- `Collision.rectCircleIntersect()`
- `Collision.pointInRect()`
- `Collision.pointInCircle()`

This is enough for many 2D arcade and casual games. Higher-level motion and collision responses stay in game code.

## Resource Management

`Loader` manages textures, audio objects, and JSON resources:

- Textures: async image load wrapped as `Texture`
- Audio: host audio context wrapped as `Audio`
- JSON: fetched through `platform.requestJSON()`

### Cache Model

- Texture and JSON caches are both `LRUCache` instances
- `loadingPromises` reuses in-flight texture requests
- `loadAll()` executes tasks in parallel and rejects when any task fails

### Stability and Performance

- Cache hits return immediately
- Disposal is explicit through `unloadTexture()`, `unloadJSON()`, and `unloadAll()`
- Audio instances are tracked and destroyed in bulk

## Script Runtime

There is no built-in VM such as Lua or a custom JS interpreter. The script runtime is the host JavaScript runtime:

- H5: browser JavaScript engine
- WeChat Mini Game: WeChat host runtime
- Douyin Mini Game: Douyin host runtime

TypeScript source is bundled into JavaScript with esbuild at build time.

## Input Handling

`Input` converts platform pointer input into `TouchPoint[]`:

- `onPointerStart` -> `onStart`
- `onPointerMove` -> `onMove`
- `onPointerEnd` -> `onEnd`

Coordinates are scaled using the platform pixel ratio so game logic works in engine-space coordinates.

### Listener Layers

- Normal listeners: cleared on scene changes
- `persistent` listeners: kept for long-lived systems such as `UIManager`

This split prevents UI input from breaking after scene switches while still cleaning per-scene listeners safely.

## Audio System

`Audio` is intentionally thin and covers:

- source assignment
- play, pause, stop
- looping
- volume control
- explicit disposal

Advanced features such as buses, mixers, DSP chains, and 3D audio are not included in the current version.

## Logging and Diagnostics

The logging system provides:

- development-time diagnostics through console, panel, and persistent storage
- runtime evidence with module names, timestamps, stacks, and formatted payloads

Key traits:

- `DEBUG / INFO / WARNING / ERROR / FATAL` levels
- async batch flushing to avoid blocking the main thread
- development-only debug stripping through `DEV:` labels and esbuild `dropLabels`

## Frame Data Flow

One typical frame looks like this:

1. The platform adapter forwards touch or mouse input into `Input`
2. `Ticker` invokes `Engine.update(dt)`
3. The active `Scene` updates nodes, components, and gameplay
4. Game logic calls into `Loader`, `Audio`, `Storage`, and `Logger` as needed
5. `Engine.render()` traverses the node tree
6. `Logger` overlays the debug panel on top of the final frame

## Compatibility and Graphics APIs

The current version supports:

- Node.js development on Windows, macOS, and Linux
- H5, WeChat Mini Game, and Douyin Mini Game runtimes
- Canvas 2D graphics

The current version does not directly implement:

- DirectX 12
- Vulkan
- OpenGL 4.5

If a host platform uses Metal, OpenGL, DirectX, or another backend internally to implement Canvas 2D, that remains host behavior rather than a native engine graphics backend.
