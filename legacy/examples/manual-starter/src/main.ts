import { Engine, H5Platform } from '../../../src/engine';
import { StarterScene } from './StarterScene';

const engine = new Engine(new H5Platform());
const scene = new StarterScene();

engine.backgroundColor = '#07111f';
engine.setScene(scene);

engine.input.onStart((touches) => {
  const point = touches[0];
  if (!point) return;
  scene.spawnStar(point.x, point.y, 1 + Math.random() * 2.5);
});

engine.start();
