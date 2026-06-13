// 引擎主控制器：组装平台、渲染器、输入、资源、主循环，驱动当前场景。
import { IPlatform } from './platform/Platform';
import { Renderer } from './render/Renderer';
import { Input } from './input/Input';
import { Loader } from './loader/Loader';
import { Ticker } from './core/Ticker';
import { Scene } from './core/Scene';

export class Engine {
  readonly renderer: Renderer;
  readonly input: Input;
  readonly loader: Loader;
  readonly width: number;
  readonly height: number;

  private ticker: Ticker;
  private scene: Scene | null = null;

  constructor(platform: IPlatform) {
    const screen = platform.getScreenInfo();
    this.width = screen.width * screen.pixelRatio;
    this.height = screen.height * screen.pixelRatio;

    const canvas = platform.createCanvas();
    this.renderer = new Renderer(canvas, this.width, this.height);
    this.input = new Input(platform, screen.pixelRatio);
    this.loader = new Loader(platform);

    this.ticker = new Ticker(
      platform,
      (dt) => this.update(dt),
      () => this.render()
    );
  }

  setScene(scene: Scene): void {
    this.scene = scene;
  }

  start(): void {
    this.ticker.start();
  }

  private update(dt: number): void {
    if (this.scene) this.scene.update(dt);
  }

  private render(): void {
    this.renderer.clear('#1d1f27');
    if (this.scene) this.scene.visit(this.renderer);
  }
}
