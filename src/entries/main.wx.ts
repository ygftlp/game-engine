// 微信端入口：注入 WxPlatform 适配器。游戏代码与引擎核心与本文件无关。
import { Engine, WxPlatform } from '../engine';
import { DemoScene } from '../game/DemoScene';

const engine = new Engine(new WxPlatform());
engine.setScene(new DemoScene(engine.width, engine.height, engine.input));
engine.start();
