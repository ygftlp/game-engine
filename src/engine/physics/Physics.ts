// 刚体物理引擎：2D 物理模拟，支持刚体、碰撞检测、碰撞响应、重力、摩擦力。
import { Vec2 } from '../math/Vec2';
import { EventEmitter } from '../core/EventEmitter';

/** 刚体类型 */
export type BodyType = 'static' | 'dynamic' | 'kinematic';

/** 碰撞形状 */
export type ShapeType = 'rect' | 'circle';

/** 碰撞形状 */
export interface Shape {
  type: ShapeType;
  /** 矩形：width/height；圆形：radius */
  width?: number;
  height?: number;
  radius?: number;
  /** 形状偏移 */
  offset?: Vec2;
}

/** 碰撞信息 */
export interface Contact {
  /** 碰撞法线（从 bodyA 指向 bodyB） */
  normal: Vec2;
  /** 穿透深度 */
  depth: number;
  /** 碰撞点 */
  point: Vec2;
  bodyA: RigidBody;
  bodyB: RigidBody;
}

/** 刚体配置 */
export interface BodyConfig {
  type?: BodyType;
  shape: Shape;
  x?: number;
  y?: number;
  mass?: number;
  restitution?: number;
  friction?: number;
  isTrigger?: boolean;
  fixedRotation?: boolean;
}

/**
 * 刚体：物理模拟的基本单位。
 */
export class RigidBody {
  type: BodyType = 'dynamic';
  shape: Shape;
  position: Vec2;
  velocity: Vec2 = new Vec2();
  acceleration: Vec2 = new Vec2();
  force: Vec2 = new Vec2();

  mass = 1;
  invMass = 1;
  restitution = 0.3;
  friction = 0.5;
  isTrigger = false;
  fixedRotation = false;

  rotation = 0;
  angularVelocity = 0;
  torque = 0;
  inertia = 1;
  invInertia = 1;

  /** 用户数据 */
  userData: any = null;
  /** 碰撞分组（位掩码） */
  collisionGroup = 0xFFFFFFFF;
  /** 碰撞掩码 */
  collisionMask = 0xFFFFFFFF;

  private _awake = true;
  private _id = RigidBody._nextId++;

  static _nextId = 0;

  get id(): number {
    return this._id;
  }

  get awake(): boolean {
    return this._awake;
  }

  constructor(config: BodyConfig) {
    this.shape = config.shape;
    this.position = new Vec2(config.x ?? 0, config.y ?? 0);
    this.type = config.type ?? 'dynamic';
    this.mass = config.mass ?? 1;
    this.restitution = config.restitution ?? 0.3;
    this.friction = config.friction ?? 0.5;
    this.isTrigger = config.isTrigger ?? false;
    this.fixedRotation = config.fixedRotation ?? false;

    if (this.type === 'static') {
      this.mass = 0;
      this.invMass = 0;
      this.inertia = 0;
      this.invInertia = 0;
    } else {
      this.updateInertia();
    }
  }

  /** 应用力 */
  applyForce(fx: number, fy: number): void {
    this.force.x += fx;
    this.force.y += fy;
    this._awake = true;
  }

  /** 应用冲量 */
  applyImpulse(ix: number, iy: number): void {
    this.velocity.x += ix * this.invMass;
    this.velocity.y += iy * this.invMass;
    this._awake = true;
  }

  /** 设置质量（自动更新惯性） */
  setMass(m: number): void {
    this.mass = m;
    this.invMass = m > 0 ? 1 / m : 0;
    this.updateInertia();
  }

  /** 获取 AABB */
  getAABB(): { x: number; y: number; width: number; height: number } {
    const ox = this.shape.offset?.x ?? 0;
    const oy = this.shape.offset?.y ?? 0;
    if (this.shape.type === 'circle') {
      const r = this.shape.radius ?? 0;
      return {
        x: this.position.x + ox - r,
        y: this.position.y + oy - r,
        width: r * 2,
        height: r * 2,
      };
    }
    const w = this.shape.width ?? 0;
    const h = this.shape.height ?? 0;
    return {
      x: this.position.x + ox - w / 2,
      y: this.position.y + oy - h / 2,
      width: w,
      height: h,
    };
  }

  /** 唤醒 */
  wake(): void {
    this._awake = true;
  }

  /** 休眠 */
  sleep(): void {
    this._awake = false;
  }

  private updateInertia(): void {
    if (this.fixedRotation || this.type === 'static') {
      this.inertia = 0;
      this.invInertia = 0;
      return;
    }
    if (this.shape.type === 'circle') {
      const r = this.shape.radius ?? 0;
      this.inertia = 0.5 * this.mass * r * r;
    } else {
      const w = this.shape.width ?? 0;
      const h = this.shape.height ?? 0;
      this.inertia = this.mass * (w * w + h * h) / 12;
    }
    this.invInertia = this.inertia > 0 ? 1 / this.inertia : 0;
  }
}

/** 物理世界配置 */
export interface WorldConfig {
  gravity?: Vec2;
  iterations?: number;
  /** 睡眠阈值（速度小于此值时进入睡眠） */
  sleepThreshold?: number;
}

/**
 * 物理世界：管理所有刚体，执行物理步进。
 */
export class PhysicsWorld extends EventEmitter {
  private bodies: RigidBody[] = [];
  private gravity: Vec2;
  private iterations: number;
  private sleepThreshold: number;
  private contacts: Contact[] = [];

  constructor(config?: WorldConfig) {
    super();
    this.gravity = config?.gravity ?? new Vec2(0, 980);
    this.iterations = config?.iterations ?? 10;
    this.sleepThreshold = config?.sleepThreshold ?? 0.5;
  }

  /** 添加刚体 */
  addBody(body: RigidBody): void {
    this.bodies.push(body);
  }

  /** 移除刚体 */
  removeBody(body: RigidBody): void {
    const idx = this.bodies.indexOf(body);
    if (idx >= 0) this.bodies.splice(idx, 1);
  }

  /** 获取所有刚体 */
  getBodies(): readonly RigidBody[] {
    return this.bodies;
  }

  /** 物理步进 */
  step(dt: number): void {
    // 应用重力
    for (const body of this.bodies) {
      if (body.type !== 'dynamic' || !body.awake) continue;
      body.velocity.x += (body.force.x * body.invMass + this.gravity.x) * dt;
      body.velocity.y += (body.force.y * body.invMass + this.gravity.y) * dt;
      body.force.x = 0;
      body.force.y = 0;
    }

    // 碰撞检测与响应
    this.contacts.length = 0;
    for (let i = 0; i < this.bodies.length; i++) {
      for (let j = i + 1; j < this.bodies.length; j++) {
        const a = this.bodies[i];
        const b = this.bodies[j];
        if (a.type === 'static' && b.type === 'static') continue;
        if (!(a.collisionGroup & b.collisionMask) || !(b.collisionGroup & a.collisionMask)) continue;

        const contact = this.detectCollision(a, b);
        if (contact) {
          this.contacts.push(contact);
        }
      }
    }

    // 碰撞求解
    for (let iter = 0; iter < this.iterations; iter++) {
      for (const contact of this.contacts) {
        this.resolveContact(contact);
      }
    }

    // 积分位置
    for (const body of this.bodies) {
      if (body.type === 'static') continue;
      body.position.x += body.velocity.x * dt;
      body.position.y += body.velocity.y * dt;

      if (!body.fixedRotation) {
        body.rotation += body.angularVelocity * dt;
      }

      // 睡眠检测
      if (body.type === 'dynamic' &&
          Math.abs(body.velocity.x) < this.sleepThreshold &&
          Math.abs(body.velocity.y) < this.sleepThreshold) {
        body.sleep();
      }
    }

    // 触发碰撞事件
    if (this.contacts.length > 0) {
      this.emit('contacts', this.contacts);
    }
  }

  /** 获取当前帧碰撞对 */
  getContacts(): readonly Contact[] {
    return this.contacts;
  }

  /** 射线投射 */
  raycast(origin: Vec2, direction: Vec2, maxDistance = 1000): { body: RigidBody; point: Vec2; normal: Vec2; distance: number } | null {
    let closest: { body: RigidBody; point: Vec2; normal: Vec2; distance: number } | null = null;

    for (const body of this.bodies) {
      const hit = this.raycastBody(origin, direction, body, maxDistance);
      if (hit && (!closest || hit.distance < closest.distance)) {
        closest = hit;
      }
    }

    return closest;
  }

  private detectCollision(a: RigidBody, b: RigidBody): Contact | null {
    if (a.shape.type === 'rect' && b.shape.type === 'rect') {
      return this.rectRectCollision(a, b);
    }
    if (a.shape.type === 'circle' && b.shape.type === 'circle') {
      return this.circleCircleCollision(a, b);
    }
    if (a.shape.type === 'rect' && b.shape.type === 'circle') {
      return this.rectCircleCollision(a, b);
    }
    if (a.shape.type === 'circle' && b.shape.type === 'rect') {
      const contact = this.rectCircleCollision(b, a);
      if (contact) {
        contact.normal.x = -contact.normal.x;
        contact.normal.y = -contact.normal.y;
        contact.bodyA = a;
        contact.bodyB = b;
      }
      return contact;
    }
    return null;
  }

  private rectRectCollision(a: RigidBody, b: RigidBody): Contact | null {
    const aAABB = a.getAABB();
    const bAABB = b.getAABB();

    const overlapX = Math.min(aAABB.x + aAABB.width, bAABB.x + bAABB.width) -
                     Math.max(aAABB.x, bAABB.x);
    const overlapY = Math.min(aAABB.y + aAABB.height, bAABB.y + bAABB.height) -
                     Math.max(aAABB.y, bAABB.y);

    if (overlapX <= 0 || overlapY <= 0) return null;

    const normal = new Vec2();
    let depth: number;

    if (overlapX < overlapY) {
      depth = overlapX;
      normal.x = a.position.x < b.position.x ? 1 : -1;
    } else {
      depth = overlapY;
      normal.y = a.position.y < b.position.y ? 1 : -1;
    }

    const point = new Vec2(
      (a.position.x + b.position.x) / 2,
      (a.position.y + b.position.y) / 2
    );

    return { normal, depth, point, bodyA: a, bodyB: b };
  }

  private circleCircleCollision(a: RigidBody, b: RigidBody): Contact | null {
    const rA = a.shape.radius ?? 0;
    const rB = b.shape.radius ?? 0;
    const dx = b.position.x - a.position.x;
    const dy = b.position.y - a.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const minDist = rA + rB;

    if (dist >= minDist) return null;

    const normal = new Vec2(dx / (dist || 1), dy / (dist || 1));
    const depth = minDist - dist;
    const point = new Vec2(
      a.position.x + normal.x * rA,
      a.position.y + normal.y * rA
    );

    return { normal, depth, point, bodyA: a, bodyB: b };
  }

  private rectCircleCollision(rect: RigidBody, circle: RigidBody): Contact | null {
    const rAABB = rect.getAABB();
    const r = circle.shape.radius ?? 0;

    const closestX = Math.max(rAABB.x, Math.min(circle.position.x, rAABB.x + rAABB.width));
    const closestY = Math.max(rAABB.y, Math.min(circle.position.y, rAABB.y + rAABB.height));

    const dx = circle.position.x - closestX;
    const dy = circle.position.y - closestY;
    const distSq = dx * dx + dy * dy;

    if (distSq >= r * r) return null;

    const dist = Math.sqrt(distSq);
    const normal = new Vec2(dx / (dist || 1), dy / (dist || 1));
    const depth = r - dist;
    const point = new Vec2(closestX, closestY);

    return { normal, depth, point, bodyA: rect, bodyB: circle };
  }

  private resolveContact(contact: Contact): void {
    const { bodyA, bodyB, normal, depth } = contact;

    // 触发器不参与响应
    if (bodyA.isTrigger || bodyB.isTrigger) return;

    const invMassSum = bodyA.invMass + bodyB.invMass;
    if (invMassSum === 0) return;

    // 位置修正（穿透分离）
    const percent = 0.8;
    const slop = 0.01;
    const correction = Math.max(depth - slop, 0) / invMassSum * percent;

    if (bodyA.type === 'dynamic') {
      bodyA.position.x -= normal.x * correction * bodyA.invMass;
      bodyA.position.y -= normal.y * correction * bodyA.invMass;
    }
    if (bodyB.type === 'dynamic') {
      bodyB.position.x += normal.x * correction * bodyB.invMass;
      bodyB.position.y += normal.y * correction * bodyB.invMass;
    }

    // 速度修正
    const relVelX = bodyB.velocity.x - bodyA.velocity.x;
    const relVelY = bodyB.velocity.y - bodyA.velocity.y;
    const velAlongNormal = relVelX * normal.x + relVelY * normal.y;

    if (velAlongNormal > 0) return;

    const e = Math.min(bodyA.restitution, bodyB.restitution);
    const j = -(1 + e) * velAlongNormal / invMassSum;

    const impulseX = j * normal.x;
    const impulseY = j * normal.y;

    if (bodyA.type === 'dynamic') {
      bodyA.velocity.x -= impulseX * bodyA.invMass;
      bodyA.velocity.y -= impulseY * bodyA.invMass;
    }
    if (bodyB.type === 'dynamic') {
      bodyB.velocity.x += impulseX * bodyB.invMass;
      bodyB.velocity.y += impulseY * bodyB.invMass;
    }

    // 摩擦力
    const tangentX = relVelX - velAlongNormal * normal.x;
    const tangentY = relVelY - velAlongNormal * normal.y;
    const tangentLen = Math.sqrt(tangentX * tangentX + tangentY * tangentY);

    if (tangentLen > 1e-6) {
      const tx = tangentX / tangentLen;
      const ty = tangentY / tangentLen;
      const jt = -(relVelX * tx + relVelY * ty) / invMassSum;

      const mu = Math.sqrt(bodyA.friction * bodyB.friction);
      let frictionImpulse: number;
      if (Math.abs(jt) < j * mu) {
        frictionImpulse = jt;
      } else {
        frictionImpulse = -j * mu;
      }

      if (bodyA.type === 'dynamic') {
        bodyA.velocity.x -= frictionImpulse * tx * bodyA.invMass;
        bodyA.velocity.y -= frictionImpulse * ty * bodyA.invMass;
      }
      if (bodyB.type === 'dynamic') {
        bodyB.velocity.x += frictionImpulse * tx * bodyB.invMass;
        bodyB.velocity.y += frictionImpulse * ty * bodyB.invMass;
      }
    }

    bodyA.wake();
    bodyB.wake();
  }

  private raycastBody(origin: Vec2, direction: Vec2, body: RigidBody, maxDist: number): { body: RigidBody; point: Vec2; normal: Vec2; distance: number } | null {
    if (body.shape.type === 'circle') {
      const r = body.shape.radius ?? 0;
      const dx = origin.x - body.position.x;
      const dy = origin.y - body.position.y;
      const a = direction.x * direction.x + direction.y * direction.y;
      const b = 2 * (dx * direction.x + dy * direction.y);
      const c = dx * dx + dy * dy - r * r;
      const discriminant = b * b - 4 * a * c;
      if (discriminant < 0) return null;

      const t = (-b - Math.sqrt(discriminant)) / (2 * a);
      if (t < 0 || t > maxDist) return null;

      const point = new Vec2(origin.x + direction.x * t, origin.y + direction.y * t);
      const normal = new Vec2(
        (point.x - body.position.x) / r,
        (point.y - body.position.y) / r
      );

      return { body, point, normal, distance: t };
    }

    // AABB 射线检测
    const aabb = body.getAABB();
    let tmin = 0;
    let tmax = maxDist;

    if (direction.x !== 0) {
      let t1 = (aabb.x - origin.x) / direction.x;
      let t2 = (aabb.x + aabb.width - origin.x) / direction.x;
      if (t1 > t2) [t1, t2] = [t2, t1];
      tmin = Math.max(tmin, t1);
      tmax = Math.min(tmax, t2);
      if (tmin > tmax) return null;
    } else if (origin.x < aabb.x || origin.x > aabb.x + aabb.width) {
      return null;
    }

    if (direction.y !== 0) {
      let t1 = (aabb.y - origin.y) / direction.y;
      let t2 = (aabb.y + aabb.height - origin.y) / direction.y;
      if (t1 > t2) [t1, t2] = [t2, t1];
      tmin = Math.max(tmin, t1);
      tmax = Math.min(tmax, t2);
      if (tmin > tmax) return null;
    } else if (origin.y < aabb.y || origin.y > aabb.y + aabb.height) {
      return null;
    }

    const t = tmin;
    const point = new Vec2(origin.x + direction.x * t, origin.y + direction.y * t);
    const normal = new Vec2(0, 0);
    if (Math.abs(point.x - aabb.x) < 0.01) normal.x = -1;
    else if (Math.abs(point.x - (aabb.x + aabb.width)) < 0.01) normal.x = 1;
    else if (Math.abs(point.y - aabb.y) < 0.01) normal.y = -1;
    else normal.y = 1;

    return { body, point, normal, distance: t };
  }
}
