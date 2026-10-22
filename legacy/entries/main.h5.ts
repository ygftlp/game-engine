// H5 端入口：注入 H5Platform 适配器。游戏代码与引擎核心与本文件无关。
import { Engine, H5Platform } from '../engine';
import { DemoScene } from '../game/DemoScene';

const engine = new Engine(new H5Platform());
engine.setScene(new DemoScene(engine.width, engine.height, engine.input));
engine.start();
