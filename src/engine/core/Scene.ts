// 场景：节点树的根容器。递归驱动组件更新。
import { Node } from './Node';

export class Scene extends Node {
  /** 生命周期：场景进入时（被设为当前场景）。 */
  onEnter(): void {}

  /** 生命周期：场景退出时。 */
  onExit(): void {}

  /** 每帧逻辑：默认驱动节点树的组件更新，子类可覆盖并调用 super.update。 */
  update(dt: number): void {
    super.update(dt);
  }
}
