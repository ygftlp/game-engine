// 引擎主控制器：通过依赖注入接收 IPlatform，与具体平台完全解耦。
// 换平台只需传入不同的适配器，引擎与游戏代码无需修改。
import { IPlatform } from './platform/Platform';
import { Renderer } from './render/Renderer';
import { Input } from './input/Input';
import { Loader } from './loader/Loader';
import { Ticker } from './core/Ticker';
import { Scene } from './core/Scene';
import { SceneManager } from './core/SceneManager';
import { Matrix2D } from './math/Matrix2D';

export class Engine {
  readonly renderer: Renderer;
  readonly input: Input;
  readonly loader: Loader;
  readonly width: number;
  readonly height: number;
  readonly platform: IPlatform;
  readonly sceneManager: SceneManager;

  private ticker: Ticker;

  constructor(platform: IPlatform) {
    this.platform = platform;
    const screen = platform.getScreenInfo();

    // 使用物理像素尺寸
    this.width = screen.width * screen.pixelRatio;
    this.height = screen.height * screen.pixelRatio;

    const canvas = platform.createCanvas();
    canvas.width = this.width;
    canvas.height = this.height;
    this.renderer = new Renderer(canvas, this.width, this.height);
    this.input = new Input(platform, screen.pixelRatio);
    this.loader = new Loader(platform);
    this.sceneManager = new SceneManager();

    this.ticker = new Ticker(
      platform,
      (dt) => this.update(dt),
      () => this.render()
    );
  }

  /** 设置初始场景（直接设置，不经过 SceneManager） */
  setScene(scene: Scene): void {
    scene.engine = this;
    this.sceneManager.clear();
    this.sceneManager.push(scene);
  }

  start(): void {
    this.ticker.start();
  }

  stop(): void {
    this.ticker.stop();
  }

  get currentScene(): Scene | null {
    return this.sceneManager.current();
  }

  private update(dt: number): void {
    const scene = this.sceneManager.current();
    if (scene) scene.update(dt);
  }

  private render(): void {
    this.renderer.clear('#1d1f27');
    const scene = this.sceneManager.current();
    if (scene) {
      const identityMatrix = new Matrix2D();
      try {
        scene.visit(this.renderer, identityMatrix, scene.camera ?? undefined);
      } catch (e) {
        console.error('[Engine] 渲染错误:', e);
      }
    } else {
      console.warn('[Engine] 没有场景');
    }
  }
}
