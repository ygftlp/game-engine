// 场景：节点树的根容器，由引擎驱动其渲染。
import { Node } from './Node';

export class Scene extends Node {
  update(_dt: number): void {
    // 子类可覆盖此方法编写每帧逻辑
  }
}
