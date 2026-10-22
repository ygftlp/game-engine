import { Engine, WxPlatform } from 'lite-game-engine';
import { MainScene } from './scenes/MainScene';

const engine = new Engine(new WxPlatform());
engine.setScene(new MainScene(engine));
engine.start();
