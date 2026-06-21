// 场景管理器：管理场景栈，支持 push/pop/replace 操作。
import { Scene } from './Scene';
import { Logger } from '../utils/Logger';

export type SceneChangeCallback = (oldScene: Scene | null, newScene: Scene | null) => void;

const sceneManagerLogger = Logger.forModule('SceneManager');

export class SceneManager {
  private stack: Scene[] = [];
  private onChangeCallbacks: SceneChangeCallback[] = [];

  /** 获取当前活跃场景。 */
  current(): Scene | null {
    return this.stack.length > 0 ? this.stack[this.stack.length - 1] : null;
  }

  /** 获取场景栈深度。 */
  size(): number {
    return this.stack.length;
  }

  /** 监听场景切换 */
  onChange(callback: SceneChangeCallback): () => void {
    this.onChangeCallbacks.push(callback);
    return () => {
      const index = this.onChangeCallbacks.indexOf(callback);
      if (index >= 0) this.onChangeCallbacks.splice(index, 1);
    };
  }

  /** 触发场景切换回调 */
  private notifyChange(oldScene: Scene | null, newScene: Scene | null): void {
    for (const callback of this.onChangeCallbacks) {
      try {
        callback(oldScene, newScene);
      } catch (e) {
        sceneManagerLogger.error('onChange callback error=%o', e);
      }
    }
  }

  /** 压入新场景（当前场景暂停，新场景进入）。 */
  push(scene: Scene): void {
    if (this.stack.includes(scene)) {
      sceneManagerLogger.warning('scene is already in the stack');
      return;
    }
    const oldScene = this.current();
    if (oldScene) oldScene.onExit();
    this.notifyChange(oldScene, scene);
    this.stack.push(scene);
    scene.onEnter();
  }

  /** 弹出当前场景（当前场景退出，前一场景恢复）。 */
  pop(): Scene | null {
    if (this.stack.length === 0) return null;
    const oldScene = this.stack.pop()!;
    const newScene = this.current();
    oldScene.onExit();
    this.notifyChange(oldScene, newScene);
    if (newScene) newScene.onEnter();
    return oldScene;
  }

  /** 替换当前场景（当前场景退出，新场景进入）。 */
  replace(scene: Scene): void {
    if (this.stack.includes(scene)) {
      sceneManagerLogger.warning('scene is already in the stack');
      return;
    }
    const oldScene = this.stack.pop() ?? null;
    if (oldScene) oldScene.onExit();
    this.notifyChange(oldScene, scene);
    this.stack.push(scene);
    scene.onEnter();
  }

  /** 清空场景栈。 */
  clear(): void {
    while (this.stack.length > 0) {
      const scene = this.stack.pop()!;
      scene.onExit();
      this.notifyChange(scene, null);
    }
  }

  /** 获取所有场景（从底到顶）。 */
  getAll(): Scene[] {
    return [...this.stack];
  }
}
