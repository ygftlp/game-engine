// 场景：节点树的根容器。递归驱动组件更新。
import { Node } from './Node';
import { Camera } from '../render/Camera';

export class Scene extends Node {
  camera: Camera | null = null;
  engine?: import('../Engine').Engine;

  onEnter(): void {}

  onExit(): void {}

  update(dt: number): void {
    super.update(dt);
  }
}
