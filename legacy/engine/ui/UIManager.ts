// UI管理器：管理所有UI组件的生命周期和交互，支持事件冒泡。
import { Node } from '../core/Node';
import { UIWidget } from './UIWidget';
import { Input, TouchPoint } from '../input/Input';
import { Renderer } from '../render/Renderer';
import { Matrix2D } from '../math/Matrix2D';

/** UI 事件：支持冒泡和停止传播 */
export class UIEvent {
  /** 当前目标（命中的最深层组件） */
  readonly target: UIWidget;
  /** 冒泡路径上的所有组件 */
  readonly bubbles: UIWidget[];
  /** 当前冒泡位置索引 */
  private _current = 0;
  /** 是否已停止传播 */
  private _stopped = false;
  /** 原始触摸点 */
  readonly point: TouchPoint;

  constructor(target: UIWidget, point: TouchPoint) {
    this.target = target;
    this.point = point;
    // 构建冒泡路径：从 target 到根
    this.bubbles = [];
    let node: Node | null = target;
    while (node) {
      if (node instanceof UIWidget) {
        this.bubbles.push(node);
      }
      node = node.parent;
    }
  }

  /** 获取当前冒泡目标 */
  get current(): UIWidget {
    return this.bubbles[this._current];
  }

  /** 是否还有下一个冒泡目标 */
  get hasNext(): boolean {
    return this._current < this.bubbles.length - 1 && !this._stopped;
  }

  /** 推进到下一个冒泡目标 */
  next(): UIWidget {
    this._current++;
    return this.bubbles[this._current];
  }

  /** 停止事件冒泡 */
  stopPropagation(): void {
    this._stopped = true;
  }

  /** 事件是否已停止传播 */
  get stopped(): boolean {
    return this._stopped;
  }
}

/** UI 事件处理器 */
export type UIEventHandler = (event: UIEvent) => void;

export class UIManager extends Node {
  private input: Input;
  private activeWidget: UIWidget | null = null;
  private hoveredWidget: UIWidget | null = null;
  private lastPoint: TouchPoint | null = null;
  private eventHandlers = new Map<string, UIEventHandler[]>();

  constructor(input: Input) {
    super();
    this.input = input;
    this.setupInput();
  }

  /** 注册 UI 事件监听 */
  on(event: string, handler: UIEventHandler): () => void {
    const handlers = this.eventHandlers.get(event) ?? [];
    handlers.push(handler);
    this.eventHandlers.set(event, handlers);
    return () => {
      const idx = handlers.indexOf(handler);
      if (idx >= 0) handlers.splice(idx, 1);
    };
  }

  /** 移除事件监听 */
  off(event: string, handler: UIEventHandler): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const idx = handlers.indexOf(handler);
      if (idx >= 0) handlers.splice(idx, 1);
    }
  }

  /** 触发 UI 事件（带冒泡） */
  private emitUI(event: string, uiEvent: UIEvent): void {
    // 从目标开始冒泡
    let current: UIWidget | null = uiEvent.target;
    while (current && !uiEvent.stopped) {
      // 先触发处理器，再按组件标记决定是否继续冒泡。
      const handlers = this.eventHandlers.get(event);
      if (handlers) {
        for (const handler of handlers) {
          handler(uiEvent);
          if (uiEvent.stopped) break;
        }
      }

      if (current.stopPropagation) {
        uiEvent.stopPropagation();
        break;
      }

      if (uiEvent.hasNext) {
        current = uiEvent.next();
      } else {
        break;
      }
    }
  }

  private setupInput(): void {
    const options = { persistent: true };
    this.input.onStart((touches) => this.handleTouchStart(touches), options);
    this.input.onMove((touches) => this.handleTouchMove(touches), options);
    this.input.onEnd((touches) => this.handleTouchEnd(touches), options);
  }

  private handleTouchStart(touches: TouchPoint[]): void {
    if (touches.length === 0) return;
    const point = touches[0];
    this.lastPoint = point;
    const widget = this.findWidgetAtPoint(point.x, point.y);
    if (widget) {
      this.activeWidget = widget;
      widget.onTouchStart(point);

      const event = new UIEvent(widget, point);
      this.emitUI('touchstart', event);
    }
  }

  private handleTouchMove(touches: TouchPoint[]): void {
    if (touches.length === 0) return;
    const point = touches[0];
    this.lastPoint = point;

    if (this.activeWidget) {
      this.activeWidget.onTouchMove(point);
    }

    // 检测触摸移动时触点下方的 widget，触发 hover 回调。
    const widget = this.findWidgetAtPoint(point.x, point.y);
    if (widget !== this.hoveredWidget) {
      if (this.hoveredWidget) {
        this.hoveredWidget.onHoverEnd();
      }
      this.hoveredWidget = widget;
      if (widget) {
        widget.onHoverStart();
      }
    }
  }

  private handleTouchEnd(touches: TouchPoint[]): void {
    if (!this.activeWidget) return;

    // 小游戏 touchend 的 touches 通常为空，必须使用 changedTouches；若平台仍传空，则回退到上一次有效点。
    const point = touches[0] ?? this.lastPoint;
    if (point) {
      this.activeWidget.onTouchEnd(point);
      const event = new UIEvent(this.activeWidget, point);
      this.emitUI('touchend', event);
    } else {
      this.activeWidget.onTouchCancel();
    }

    this.activeWidget = null;
    this.lastPoint = null;
    if (this.hoveredWidget) {
      this.hoveredWidget.onHoverEnd();
      this.hoveredWidget = null;
    }
  }

  /** 查找指定点下的UI组件 */
  private findWidgetAtPoint(x: number, y: number): UIWidget | null {
    return this.findWidgetInNode(this, x, y);
  }

  private findWidgetInNode(node: Node, x: number, y: number): UIWidget | null {
    // 先检查更高渲染层级的子节点，确保命中顺序与绘制顺序一致。
    const ordered = node.getChildrenInRenderOrder();
    for (let i = ordered.length - 1; i >= 0; i--) {
      const child = ordered[i];
      const result = this.findWidgetInNode(child, x, y);
      if (result) return result;
    }

    // 检查当前节点。
    if (node instanceof UIWidget && node.visible && node.interactive && !node.disabled) {
      const local = node.worldMatrix.invertPoint(x, y);
      if (local && this.isPointInWidget(node, local.x, local.y)) {
        return node;
      }
    }

    return null;
  }

  /** 检查点是否在UI组件内 */
  private isPointInWidget(widget: UIWidget, lx: number, ly: number): boolean {
    const left = -widget.width * widget.anchorX;
    const top = -widget.height * widget.anchorY;
    return lx >= left && lx <= left + widget.width && ly >= top && ly <= top + widget.height;
  }

  /** 添加UI组件 */
  addWidget(widget: UIWidget): void {
    this.addChild(widget);
  }

  /** 移除UI组件 */
  removeWidget(widget: UIWidget): void {
    this.removeChild(widget);
  }

  /** 清除所有UI组件 */
  clearAll(): void {
    while (this.children.length > 0) {
      this.children[0].removeFromParent();
    }
    this.activeWidget = null;
    this.hoveredWidget = null;
    this.lastPoint = null;
  }

  /** 查找指定名称的组件 */
  findWidgetByName(name: string): UIWidget | null {
    return this.findByName(this, name);
  }

  private findByName(node: Node, name: string): UIWidget | null {
    if (node instanceof UIWidget && node.name === name) {
      return node;
    }
    for (const child of node.children) {
      const result = this.findByName(child, name);
      if (result) return result;
    }
    return null;
  }

  /** 更新所有组件 */
  update(dt: number): void {
    for (const child of this.children) {
      child.update(dt);
    }
  }

  /** 渲染所有组件 */
  render(renderer: Renderer): void {
    this.visit(renderer, new Matrix2D());
  }
}
