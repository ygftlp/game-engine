// 微信小游戏入口逻辑：创建引擎、加载示例场景并启动主循环。
import { Engine, WxPlatform } from './engine';
import { DemoScene } from './game/DemoScene';

const platform = new WxPlatform();
const engine = new Engine(platform);
const scene = new DemoScene(engine.width, engine.height, engine.input);
engine.setScene(scene);
engine.start();
