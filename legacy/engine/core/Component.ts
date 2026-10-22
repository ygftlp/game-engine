// 组件基类：行为从继承改为组合。通过挂载到 Node 上复用逻辑。
// 生命周期：onAttach（挂载时）、onUpdate（每帧）、onDetach（移除时）。
import type { Node } from './Node';

export abstract class Component {
  /** 挂载的宿主节点，由 Node.addComponent 赋值。 */
  node!: Node;
  enabled = true;

  /** 组件被挂载到节点时调用。 */
  onAttach(): void {}

  /** 每帧逻辑更新，dt 为秒。 */
  onUpdate(_dt: number): void {}

  /** 组件从节点移除时调用。 */
  onDetach(): void {}
}
