// 转向行为：支持寻路、避障、群集、巡逻等 AI 行为。

import { Vec2 } from '../math/Vec2';

/** 转向力输出 */
export interface SteeringOutput {
  /** 线性力 */
  linear: Vec2;
  /** 角速度 */
  angular: number;
}

/** 碰撞检测结果 */
export interface CollisionInfo {
  /** 碰撞点 */
  point: Vec2;
  /** 碰撞法线 */
  normal: Vec2;
  /** 碰撞距离 */
  distance: number;
}

/**
 * 转向行为基类
 */
export abstract class SteeringBehavior {
  /** 权重 */
  weight = 1;

  abstract calculate(target: SteeringTarget): SteeringOutput;
}

/** 转向目标 */
export interface SteeringTarget {
  /** 当前位置 */
  position: Vec2;
  /** 当前朝向（弧度） */
  orientation: number;
  /** 当前速度 */
  velocity: Vec2;
  /** 目标位置（用于追击/逃跑） */
  targetPosition?: Vec2;
  /** 目标速度（用于追击移动目标） */
  targetVelocity?: Vec2;
  /** 已知障碍物 */
  obstacles?: { position: Vec2; radius: number }[];
  /** 已知邻居（用于群集） */
  neighbors?: SteeringTarget[];
}

// ========== 基础行为 ==========

/** 寻路行为：沿路径点移动 */
export class Seek extends SteeringBehavior {
  private path: Vec2[] = [];
  private currentWaypoint = 0;
  private waypointRadius = 20;

  constructor(path?: Vec2[], waypointRadius = 20) {
    super();
    this.path = path ?? [];
    this.waypointRadius = waypointRadius;
  }

  /** 设置路径 */
  setPath(path: Vec2[]): void {
    this.path = path;
    this.currentWaypoint = 0;
  }

  /** 获取当前路径 */
  getPath(): Vec2[] {
    return this.path;
  }

  calculate(target: SteeringTarget): SteeringOutput {
    if (this.path.length === 0) {
      return { linear: new Vec2(), angular: 0 };
    }

    const waypoint = this.path[this.currentWaypoint];
    const toWaypoint = waypoint.subtract(target.position);
    const distance = toWaypoint.length();

    // 到达路径点，切换到下一个
    if (distance < this.waypointRadius) {
      this.currentWaypoint = Math.min(this.currentWaypoint + 1, this.path.length - 1);
    }

    // 向目标点移动
    const desired = toWaypoint.normalize().scale(100); // 假设最大速度 100
    const steer = desired.subtract(target.velocity);

    return {
      linear: steer.scale(this.weight),
      angular: 0,
    };
  }
}

/** 追击行为：追击移动目标 */
export class Pursue extends SteeringBehavior {
  private maxPrediction = 0.5;

  constructor(maxPrediction = 0.5) {
    super();
    this.maxPrediction = maxPrediction;
  }

  calculate(target: SteeringTarget): SteeringOutput {
    if (!target.targetPosition || !target.targetVelocity) {
      return { linear: new Vec2(), angular: 0 };
    }

    // 预测目标位置
    const predicted = target.targetPosition.add(target.targetVelocity.scale(this.maxPrediction));

    // 向预测位置移动
    const desired = predicted.subtract(target.position).normalize().scale(100);
    const steer = desired.subtract(target.velocity);

    return {
      linear: steer.scale(this.weight),
      angular: 0,
    };
  }
}

/** 逃跑行为：远离目标 */
export class Flee extends SteeringBehavior {
  private panicRadius = 200;

  constructor(panicRadius = 200) {
    super();
    this.panicRadius = panicRadius;
  }

  calculate(target: SteeringTarget): SteeringOutput {
    if (!target.targetPosition) {
      return { linear: new Vec2(), angular: 0 };
    }

    const toTarget = target.position.subtract(target.targetPosition);
    const distance = toTarget.length();

    if (distance > this.panicRadius) {
      return { linear: new Vec2(), angular: 0 };
    }

    const desired = toTarget.normalize().scale(100);
    const steer = desired.subtract(target.velocity);

    return {
      linear: steer.scale(this.weight),
      angular: 0,
    };
  }
}

/** 到达行为：到达目标位置时减速 */
export class Arrive extends SteeringBehavior {
  private slowRadius = 100;
  private targetRadius = 5;

  constructor(slowRadius = 100, targetRadius = 5) {
    super();
    this.slowRadius = slowRadius;
    this.targetRadius = targetRadius;
  }

  calculate(target: SteeringTarget): SteeringOutput {
    if (!target.targetPosition) {
      return { linear: new Vec2(), angular: 0 };
    }

    const toTarget = target.targetPosition.subtract(target.position);
    const distance = toTarget.length();

    if (distance < this.targetRadius) {
      return { linear: new Vec2(), angular: 0 };
    }

    let speed: number;
    if (distance > this.slowRadius) {
      speed = 100;
    } else {
      speed = 100 * (distance / this.slowRadius);
    }

    const desired = toTarget.normalize().scale(speed);
    const steer = desired.subtract(target.velocity);

    return {
      linear: steer.scale(this.weight),
      angular: 0,
    };
  }
}

// ========== 避障行为 ==========

/** 碰撞躲避行为 */
export class CollisionAvoidance extends SteeringBehavior {
  private lookAhead = 100;
  private avoidanceForce = 200;

  constructor(lookAhead = 100, avoidanceForce = 200) {
    super();
    this.lookAhead = lookAhead;
    this.avoidanceForce = avoidanceForce;
  }

  calculate(target: SteeringTarget): SteeringOutput {
    if (!target.obstacles || target.obstacles.length === 0) {
      return { linear: new Vec2(), angular: 0 };
    }

    const futurePos = target.position.add(target.velocity.normalize().scale(this.lookAhead));
    let closest: CollisionInfo | null = null;

    for (const obs of target.obstacles) {
      const diff = futurePos.subtract(obs.position);
      const dist = diff.length();
      const combinedRadius = obs.radius + 20; // 加上自身半径

      if (dist < combinedRadius) {
        const overlap = combinedRadius - dist;
        const normal = diff.normalize();
        const point = obs.position.add(normal.scale(obs.radius));

        if (!closest || overlap > closest.distance) {
          closest = { point, normal, distance: overlap };
        }
      }
    }

    if (!closest) {
      return { linear: new Vec2(), angular: 0 };
    }

    // 施加躲避力
    const steer = closest.normal.scale(this.avoidanceForce * (closest.distance / 50));
    return {
      linear: steer.scale(this.weight),
      angular: 0,
    };
  }
}

/** 障碍物躲避行为（更精确） */
export class ObstacleAvoidance extends SteeringBehavior {
  private lookAhead = 150;
  private avoidDistance = 50;

  constructor(lookAhead = 150, avoidDistance = 50) {
    super();
    this.lookAhead = lookAhead;
    this.avoidDistance = avoidDistance;
  }

  calculate(target: SteeringTarget): SteeringOutput {
    if (!target.obstacles || target.obstacles.length === 0) {
      return { linear: new Vec2(), angular: 0 };
    }

    const ahead = target.velocity.normalize().scale(this.lookAhead);
    const ahead2 = ahead.scale(0.5);
    const futurePos1 = target.position.add(ahead);
    const futurePos2 = target.position.add(ahead2);

    let closestObs: { position: Vec2; radius: number } | null = null;
    let closestDist = Infinity;

    for (const obs of target.obstacles) {
      const d1 = futurePos1.subtract(obs.position).length();
      const d2 = futurePos2.subtract(obs.position).length();
      const d = Math.min(d1, d2);

      if (d < obs.radius + this.avoidDistance && d < closestDist) {
        closestDist = d;
        closestObs = obs;
      }
    }

    if (!closestObs) {
      return { linear: new Vec2(), angular: 0 };
    }

    let avoidVector = futurePos1.subtract(closestObs.position).normalize().scale(this.avoidanceForce);

    // 如果目标在障碍物前方，施加侧向力
    if (target.velocity.dot(avoidVector) < 0) {
      avoidVector = new Vec2(-avoidVector.y, avoidVector.x);
    }

    return {
      linear: avoidVector.scale(this.weight),
      angular: 0,
    };
  }

  private get avoidanceForce(): number {
    return 200;
  }
}

// ========== 群集行为 ==========

/** 分离行为：避免与邻居碰撞 */
export class Separation extends SteeringBehavior {
  private separationRadius = 50;

  constructor(separationRadius = 50) {
    super();
    this.separationRadius = separationRadius;
  }

  calculate(target: SteeringTarget): SteeringOutput {
    if (!target.neighbors || target.neighbors.length === 0) {
      return { linear: new Vec2(), angular: 0 };
    }

    let steer = new Vec2();

    for (const neighbor of target.neighbors) {
      const diff = target.position.subtract(neighbor.position);
      const dist = diff.length();

      if (dist < this.separationRadius && dist > 0) {
        steer = steer.add(diff.normalize().scale(1 / dist));
      }
    }

    return {
      linear: steer.scale(this.weight),
      angular: 0,
    };
  }
}

/** 对齐行为：与邻居保持相同速度 */
export class Alignment extends SteeringBehavior {
  private neighborRadius = 100;

  constructor(neighborRadius = 100) {
    super();
    this.neighborRadius = neighborRadius;
  }

  calculate(target: SteeringTarget): SteeringOutput {
    if (!target.neighbors || target.neighbors.length === 0) {
      return { linear: new Vec2(), angular: 0 };
    }

    let avgVelocity = new Vec2();
    let count = 0;

    for (const neighbor of target.neighbors) {
      const dist = target.position.subtract(neighbor.position).length();
      if (dist < this.neighborRadius) {
        avgVelocity = avgVelocity.add(neighbor.velocity);
        count++;
      }
    }

    if (count === 0) return { linear: new Vec2(), angular: 0 };

    avgVelocity = avgVelocity.scale(1 / count);
    const steer = avgVelocity.subtract(target.velocity);

    return {
      linear: steer.scale(this.weight),
      angular: 0,
    };
  }
}

/** 聚集行为：向邻居中心移动 */
export class Cohesion extends SteeringBehavior {
  private neighborRadius = 150;

  constructor(neighborRadius = 150) {
    super();
    this.neighborRadius = neighborRadius;
  }

  calculate(target: SteeringTarget): SteeringOutput {
    if (!target.neighbors || target.neighbors.length === 0) {
      return { linear: new Vec2(), angular: 0 };
    }

    let center = new Vec2();
    let count = 0;

    for (const neighbor of target.neighbors) {
      const dist = target.position.subtract(neighbor.position).length();
      if (dist < this.neighborRadius) {
        center = center.add(neighbor.position);
        count++;
      }
    }

    if (count === 0) return { linear: new Vec2(), angular: 0 };

    center = center.scale(1 / count);
    const desired = center.subtract(target.position).normalize().scale(100);
    const steer = desired.subtract(target.velocity);

    return {
      linear: steer.scale(this.weight),
      angular: 0,
    };
  }
}

// ========== 组合行为 ==========

/** 转向行为组合器 */
export class SteeringComposite {
  private behaviors: SteeringBehavior[] = [];

  /** 添加行为 */
  addBehavior(behavior: SteeringBehavior): void {
    this.behaviors.push(behavior);
  }

  /** 移除行为 */
  removeBehavior(behavior: SteeringBehavior): void {
    const idx = this.behaviors.indexOf(behavior);
    if (idx >= 0) this.behaviors.splice(idx, 1);
  }

  /** 计算合成转向力 */
  calculate(target: SteeringTarget): SteeringOutput {
    let totalLinear = new Vec2();
    let totalAngular = 0;

    for (const behavior of this.behaviors) {
      const output = behavior.calculate(target);
      totalLinear = totalLinear.add(output.linear);
      totalAngular += output.angular;
    }

    return {
      linear: totalLinear,
      angular: totalAngular,
    };
  }

  /** 清除所有行为 */
  clear(): void {
    this.behaviors.length = 0;
  }
}
