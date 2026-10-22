// 行为树：支持节点类型、条件判断、并行执行、黑板共享数据。

/** 节点状态 */
export enum NodeStatus {
  SUCCESS = 'success',
  FAILURE = 'failure',
  RUNNING = 'running',
}

/** 行为树节点基类 */
export abstract class BTNode {
  name: string;

  constructor(name = '') {
    this.name = name;
  }

  abstract tick(blackboard: Blackboard): NodeStatus;

  reset(): void {
    // 子类可覆盖
  }
}

/** 黑板：行为树共享数据存储 */
export class Blackboard {
  private data = new Map<string, unknown>();
  private parent: Blackboard | null = null;

  constructor(parent?: Blackboard) {
    this.parent = parent ?? null;
  }

  /** 设置值 */
  set<T>(key: string, value: T): void {
    this.data.set(key, value);
  }

  /** 获取值 */
  get<T>(key: string): T | undefined {
    if (this.data.has(key)) {
      return this.data.get(key) as T;
    }
    return this.parent?.get<T>(key);
  }

  /** 检查键是否存在 */
  has(key: string): boolean {
    return this.data.has(key) || (this.parent?.has(key) ?? false);
  }

  /** 删除值 */
  delete(key: string): void {
    this.data.delete(key);
  }

  /** 清空 */
  clear(): void {
    this.data.clear();
  }
}

// ========== 组合节点 ==========

/** 装饰器节点基类 */
export abstract class Decorator extends BTNode {
  protected child: BTNode;

  constructor(name: string, child: BTNode) {
    super(name);
    this.child = child;
  }

  reset(): void {
    this.child.reset();
  }
}

/** 反转：成功变失败，失败变成功 */
export class Inverter extends Decorator {
  constructor(child: BTNode) {
    super('Inverter', child);
  }

  tick(blackboard: Blackboard): NodeStatus {
    const result = this.child.tick(blackboard);
    if (result === NodeStatus.SUCCESS) return NodeStatus.FAILURE;
    if (result === NodeStatus.FAILURE) return NodeStatus.SUCCESS;
    return NodeStatus.RUNNING;
  }
}

/** 重复器：重复执行 N 次 */
export class Repeater extends Decorator {
  private times: number;
  private count = 0;

  constructor(child: BTNode, times = -1) {
    super('Repeater', child);
    this.times = times;
  }

  tick(blackboard: Blackboard): NodeStatus {
    const result = this.child.tick(blackboard);

    if (result === NodeStatus.RUNNING) {
      return NodeStatus.RUNNING;
    }

    this.count++;

    if (this.times > 0 && this.count >= this.times) {
      this.count = 0;
      return NodeStatus.SUCCESS;
    }

    this.child.reset();
    return NodeStatus.RUNNING;
  }

  reset(): void {
    super.reset();
    this.count = 0;
  }
}

/** 限时器：超时返回失败 */
export class Timeout extends Decorator {
  private duration: number;
  private elapsed = 0;

  constructor(child: BTNode, duration: number) {
    super('Timeout', child);
    this.duration = duration;
  }

  tick(blackboard: Blackboard): NodeStatus {
    this.elapsed += blackboard.get<number>('deltaTime') ?? 0.016;

    if (this.elapsed >= this.duration) {
      this.elapsed = 0;
      return NodeStatus.FAILURE;
    }

    return this.child.tick(blackboard);
  }

  reset(): void {
    super.reset();
    this.elapsed = 0;
  }
}

// ========== 组合节点 ==========

/** 序列：依次执行子节点，全部成功才成功 */
export class Sequence extends BTNode {
  private children: BTNode[];
  private runningIndex = 0;

  constructor(name: string, children: BTNode[]) {
    super(name);
    this.children = children;
  }

  tick(blackboard: Blackboard): NodeStatus {
    for (let i = this.runningIndex; i < this.children.length; i++) {
      const result = this.children[i].tick(blackboard);

      if (result === NodeStatus.RUNNING) {
        this.runningIndex = i;
        return NodeStatus.RUNNING;
      }

      if (result === NodeStatus.FAILURE) {
        this.runningIndex = 0;
        return NodeStatus.FAILURE;
      }
    }

    this.runningIndex = 0;
    return NodeStatus.SUCCESS;
  }

  reset(): void {
    super.reset();
    this.runningIndex = 0;
    for (const child of this.children) {
      child.reset();
    }
  }
}

/** 选择：依次执行子节点，任一成功即成功 */
export class Selector extends BTNode {
  private children: BTNode[];
  private runningIndex = 0;

  constructor(name: string, children: BTNode[]) {
    super(name);
    this.children = children;
  }

  tick(blackboard: Blackboard): NodeStatus {
    for (let i = this.runningIndex; i < this.children.length; i++) {
      const result = this.children[i].tick(blackboard);

      if (result === NodeStatus.RUNNING) {
        this.runningIndex = i;
        return NodeStatus.RUNNING;
      }

      if (result === NodeStatus.SUCCESS) {
        this.runningIndex = 0;
        return NodeStatus.SUCCESS;
      }
    }

    this.runningIndex = 0;
    return NodeStatus.FAILURE;
  }

  reset(): void {
    super.reset();
    this.runningIndex = 0;
    for (const child of this.children) {
      child.reset();
    }
  }
}

/** 随机选择：随机执行一个子节点 */
export class RandomSelector extends BTNode {
  private children: BTNode[];

  constructor(name: string, children: BTNode[]) {
    super(name);
    this.children = children;
  }

  tick(blackboard: Blackboard): NodeStatus {
    const index = Math.floor(Math.random() * this.children.length);
    return this.children[index].tick(blackboard);
  }
}

/** 并行：同时执行所有子节点 */
export class Parallel extends BTNode {
  private children: BTNode[];
  private successThreshold: number;

  constructor(name: string, children: BTNode[], successThreshold?: number) {
    super(name);
    this.children = children;
    this.successThreshold = successThreshold ?? children.length;
  }

  tick(blackboard: Blackboard): NodeStatus {
    let successCount = 0;
    let failureCount = 0;

    for (const child of this.children) {
      const result = child.tick(blackboard);
      if (result === NodeStatus.SUCCESS) successCount++;
      else if (result === NodeStatus.FAILURE) failureCount++;
    }

    if (successCount >= this.successThreshold) return NodeStatus.SUCCESS;
    if (failureCount > this.children.length - this.successThreshold) return NodeStatus.FAILURE;
    return NodeStatus.RUNNING;
  }

  reset(): void {
    super.reset();
    for (const child of this.children) {
      child.reset();
    }
  }
}

// ========== 叶子节点 ==========

/** 条件节点：根据条件返回成功/失败 */
export class Condition extends BTNode {
  private condition: (blackboard: Blackboard) => boolean;

  constructor(name: string, condition: (blackboard: Blackboard) => boolean) {
    super(name);
    this.condition = condition;
  }

  tick(blackboard: Blackboard): NodeStatus {
    return this.condition(blackboard) ? NodeStatus.SUCCESS : NodeStatus.FAILURE;
  }
}

/** 动作节点：执行具体行为 */
export class Action extends BTNode {
  private action: (blackboard: Blackboard) => NodeStatus;

  constructor(name: string, action: (blackboard: Blackboard) => NodeStatus) {
    super(name);
    this.action = action;
  }

  tick(blackboard: Blackboard): NodeStatus {
    return this.action(blackboard);
  }
}

// ========== 行为树 ==========

/** 行为树 */
export class BehaviorTree {
  root: BTNode;
  blackboard: Blackboard;

  constructor(root: BTNode, blackboard?: Blackboard) {
    this.root = root;
    this.blackboard = blackboard ?? new Blackboard();
  }

  /** 每帧更新 */
  tick(): NodeStatus {
    return this.root.tick(this.blackboard);
  }

  /** 重置树 */
  reset(): void {
    this.root.reset();
  }
}

// ========== 常用条件和动作 ==========

/** 条件：黑板值存在 */
export function conditionHasKey(key: string): Condition {
  return new Condition(`HasKey(${key})`, (bb) => bb.has(key));
}

/** 条件：黑板值大于 */
export function conditionGreaterThan(key: string, value: number): Condition {
  return new Condition(`${key} > ${value}`, (bb) => (bb.get<number>(key) ?? 0) > value);
}

/** 条件：黑板值小于 */
export function conditionLessThan(key: string, value: number): Condition {
  return new Condition(`${key} < ${value}`, (bb) => (bb.get<number>(key) ?? 0) < value);
}

/** 动作：设置黑板值 */
export function actionSetBlackboard<T>(key: string, value: T): Action {
  return new Action(`Set(${key})`, (bb) => {
    bb.set(key, value);
    return NodeStatus.SUCCESS;
  });
}

/** 动作：等待指定时间 */
export function actionWait(seconds: number): Action {
  let elapsed = 0;
  return new Action(`Wait(${seconds}s)`, (bb) => {
    elapsed += bb.get<number>('deltaTime') ?? 0.016;
    if (elapsed >= seconds) {
      elapsed = 0;
      return NodeStatus.SUCCESS;
    }
    return NodeStatus.RUNNING;
  });
}
