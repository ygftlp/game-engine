import { Engine, WxPlatform } from 'lite-game-engine';
import { ShooterScene } from './scenes/ShooterScene';

const engine = new Engine(new WxPlatform());
engine.setScene(new ShooterScene(engine));
engine.start();
