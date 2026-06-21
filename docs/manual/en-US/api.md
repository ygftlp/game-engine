# API Reference

## Notes

- Public API names follow `src/engine/index.ts`
- This reference focuses on exported interfaces rather than private implementation details
- Examples use TypeScript

## Core Module

### `Engine`

Purpose: lifecycle control, frame loop, scene switching, and global subsystem access.

```ts
const engine = new Engine(platform);
engine.setScene(scene);
engine.start();
```

| Member | Description |
| --- | --- |
| `constructor(platform: IPlatform)` | creates the engine and initializes renderer, input, loader, and scene management |
| `renderer` | global renderer |
| `input` | global input system |
| `loader` | global resource loader |
| `sceneManager` | scene stack manager |
| `backgroundColor` | per-frame clear color |
| `setScene(scene)` | replaces the current scene |
| `pushScene(scene)` | pushes a new scene |
| `popScene()` | pops the current scene |
| `start()` | starts the frame loop |
| `destroy()` | stops the loop and disposes resources |

### `Scene`

Purpose: node-tree root for a level, menu, or gameplay screen.

| Method | Return | Description |
| --- | --- | --- |
| `onEnter()` | `void` | called when the scene becomes active |
| `onExit()` | `void` | called when the scene leaves |
| `update(dt)` | `void` | per-frame update; by default updates child nodes |

### `Node`

Purpose: transformable, component-enabled, hit-testable base node.

| Property / Method | Description |
| --- | --- |
| `x / y / rotation / scaleX / scaleY` | 2D transform fields |
| `width / height / anchorX / anchorY` | bounds and anchor |
| `alpha / visible / zIndex` | render state |
| `children` | child list |
| `components` | attached components |
| `addChild(child)` | attach a child node |
| `removeChild(child)` | detach a child node |
| `removeFromParent()` | detach from current parent |
| `addComponent(component)` | attach reusable behavior |
| `getComponent(type)` | get a component instance |
| `removeComponent(component)` | remove a component |
| `update(dt)` | recursive update |
| `visit(renderer, parentMatrix)` | recursive render traversal |
| `hitTest(worldX, worldY)` | hit test against the node tree |
| `destroy()` | dispose node, components, and descendants |

### `Component`

Purpose: reusable behavior attached to `Node`.

| Method | Description |
| --- | --- |
| `onAttach()` | runs on attach |
| `onUpdate(dt)` | per-frame logic |
| `onDetach()` | runs on removal |

## Rendering

### `Renderer`

| Method | Description |
| --- | --- |
| `constructor(canvas, width, height)` | initializes the Canvas 2D renderer |
| `clear(color?)` | clears the backbuffer |
| `drawRect(x, y, w, h, color)` | draws a rectangle |
| `drawText(text, x, y, color, font?)` | draws text |

### `Texture`

| Member | Description |
| --- | --- |
| `constructor(image)` | wraps a platform image |
| `width` | texture width |
| `height` | texture height |

### `Sprite`

| Method | Description |
| --- | --- |
| `constructor(texture?)` | creates a sprite node |
| `setTexture(texture, frame?)` | sets texture and optional atlas frame |
| `setFrame(frame)` | switches the source frame |

### `AnimationClip`

Purpose: discrete frame animation definition.

Key fields:

- `name`
- `frames`
- `fps`
- `mode`

### `Animator`

Typical usage:

```ts
const animator = new Animator();
animator.addClip(walkClip);
animator.play('walk');
```

## Input

### `Input`

| Method | Return | Description |
| --- | --- | --- |
| `onStart(fn, options?)` | `() => void` | register pointer-down listener |
| `onMove(fn, options?)` | `() => void` | register pointer-move listener |
| `onEnd(fn, options?)` | `() => void` | register pointer-up listener |
| `off(event, fn)` | `void` | remove one listener |
| `removeAllListeners(includePersistent?)` | `void` | clear listeners |

`InputListenerOptions` currently contains:

- `persistent?: boolean`

### `TouchPoint`

```ts
interface TouchPoint {
  id: number;
  x: number;
  y: number;
}
```

## Resources and Audio

### `Loader`

| Method | Return | Description |
| --- | --- | --- |
| `loadTexture(url)` | `Promise<Texture>` | loads and caches a texture |
| `loadAudio(url)` | `Audio` | creates an audio instance |
| `loadJSON<T>(url)` | `Promise<T>` | loads and caches JSON |
| `loadAll(tasks, onProgress?)` | `Promise<void>` | parallel batch loading |
| `getTexture(url)` | `Texture \| null` | returns cached texture |
| `unloadTexture(url)` | `boolean` | evicts a texture |
| `unloadJSON(url)` | `boolean` | evicts cached JSON |
| `unloadAll()` | `void` | clears all tracked resources |
| `getCacheStats()` | stats object | returns cache summary |

### `Audio`

| Method / Property | Description |
| --- | --- |
| `load(url)` | sets the source |
| `play(loop?)` | starts playback |
| `pause()` | pauses playback |
| `stop()` | stops playback |
| `volume = v` | changes volume |
| `destroy()` | disposes the host audio object |

## Collision and Math

### `Collision`

| Method | Description |
| --- | --- |
| `rectIntersect(a, b)` | AABB rectangle intersection |
| `circleIntersect(a, b)` | circle intersection |
| `rectCircleIntersect(rect, circle)` | rectangle vs circle test |
| `pointInRect(px, py, rect)` | point inside rectangle |
| `pointInCircle(px, py, circle)` | point inside circle |

### `Vec2`

Common instance methods:

- `add(v)`
- `subtract(v)`
- `scale(s)`
- `normalize()`
- `dot(v)`
- `length()`
- `distance(v)`
- `lerp(v, t)`
- `clone()`
- `equals(v)`

Static constants:

- `Vec2.ZERO`
- `Vec2.ONE`
- `Vec2.UP`
- `Vec2.DOWN`
- `Vec2.LEFT`
- `Vec2.RIGHT`

## Utilities

### `Logger`

| Method | Description |
| --- | --- |
| `configure(config)` | merges logger configuration |
| `attachPlatform(platform)` | enables persistent storage sink |
| `setDevelopmentMode(flag)` | toggles dev mode |
| `setLevel(level)` | sets the threshold |
| `forModule(moduleName)` | returns a module logger |
| `flush()` | flushes the async queue |
| `renderPanel(renderer)` | renders the debug panel |
| `getPanelLines()` | returns the panel buffer |
| `dispose()` | disposes sinks and buffers |

### `ModuleLogger`

Method set:

- `debug(message, ...args)`
- `info(message, ...args)`
- `warning(message, ...args)`
- `warn(message, ...args)`
- `error(message, ...args)`
- `fatal(message, ...args)`

### `Storage`

| Method | Description |
| --- | --- |
| `set(key, value)` | stores JSON data |
| `get<T>(key, defaultValue?)` | reads data |
| `has(key)` | checks existence |
| `remove(key)` | removes one key |
| `clear()` | clears keys inside the current namespace |

### Other Utilities

| API | Description |
| --- | --- |
| `EventEmitter` | pub/sub events |
| `Pool` | object pooling |
| `TimerManager` | delayed and recurring timers |
| `MathUtils` | shared math helpers |
| `LRUCache` | least-recently-used cache |
| `ScreenAdapter` | safe area and layout adaptation |
| `ErrorHandlerManager` | global error handling |

#### `TimerManager` example

```ts
const timers = new TimerManager();

const delayId = timers.delay(() => {
  logger.info('fires after 2 seconds');
}, 2);

const intervalId = timers.interval(() => {
  logger.debug('fires every second');
}, 1);

timers.pause(intervalId);
timers.resume(intervalId);
timers.cancel(delayId);
timers.update(dt);
```

#### `ScreenAdapter` example

```ts
const adapter = new ScreenAdapter(375, 812, window.devicePixelRatio, {
  designWidth: 750,
  designHeight: 1334,
  fitMode: 'contain',
});

const pos = adapter.designToScreen(375, 667);
const safeArea = adapter.getScaledSafeArea();
```

## UI

Currently exported UI widgets:

- `UIWidget`
- `Button`
- `Label`
- `ProgressBar`
- `Panel`
- `Toggle`
- `Slider`
- `Dialog`
- `Toast`
- `Joystick`
- `HealthBar`
- `UIManager`

Recommended workflow:

1. create a widget instance
2. set size, position, and optional name
3. attach it to `UIManager`
4. let `UIManager` handle hit testing and interaction

### `UIWidget`

Base capabilities:

- `interactive` / `disabled`
- `backgroundColor` / `borderColor` / `borderWidth`
- `borderRadius`
- `setPadding(padding)`
- `onTouchStart()` / `onTouchMove()` / `onTouchEnd()`

### `Button`

```ts
const button = new Button('Start', 180, 56);
button.x = 200;
button.y = 320;
button.setStyle({
  normalColor: '#4ecdc4',
  pressedColor: '#45b7aa',
  textColor: '#ffffff',
  borderRadius: 12,
});
button.onClickCallback = () => {
  logger.info('button clicked');
};

uiManager.addWidget(button);
```

### `UIManager`

```ts
const uiManager = new UIManager(engine.input);
scene.addChild(uiManager);

const panel = new Panel(280, 140);
panel.name = 'hud-panel';
panel.x = 200;
panel.y = 120;
uiManager.addWidget(panel);

const found = uiManager.findWidgetByName('hud-panel');
```

## Commercial Extensions

Exported modules:

- `I18n`
- `PaymentManager`
- `AnalyticsManager`
- `AntiAddictionSystem`

These APIs are integration-oriented. Review the platform-specific source before production adoption.

## Platform Interface

### `IPlatform`

Key capabilities:

- `createCanvas()`
- `createImage()`
- `createAudio()`
- `getScreenInfo()`
- `onPointerStart(handler)`
- `onPointerMove(handler)`
- `onPointerEnd(handler)`
- `requestJSON(url)`
- `requestAnimationFrame(cb)`
- `setStorage(key, value)`
- `getStorage(key)`
- `removeStorage(key)`
- `clearStorage()`

#### Minimal bootstrap example

```ts
import { Engine, H5Platform } from 'lite-game-engine';

const platform = new H5Platform();
const engine = new Engine(platform);
engine.setScene(new GameScene());
engine.start();
```

#### H5 platform behavior

- `createCanvas()` creates and mounts a full-screen canvas
- touch and mouse input are normalized into pointer events
- `requestJSON()` uses `fetch`
- storage uses `localStorage`

Implementations:

- `H5Platform`
- `WxPlatform`
- `TtPlatform`
