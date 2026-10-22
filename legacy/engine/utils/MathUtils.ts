// 数学工具函数：提供常用的数学计算能力。
export class MathUtils {
  /** 限制值在指定范围内。 */
  static clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  /** 线性插值。 */
  static lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  /** 角度转弧度。 */
  static degToRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /** 弧度转角度。 */
  static radToDeg(radians: number): number {
    return radians * (180 / Math.PI);
  }

  /** 生成指定范围内的随机整数（包含两端）。 */
  static randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /** 生成指定范围内的随机浮点数。 */
  static randomFloat(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  /** 检查两个值是否近似相等。 */
  static approximately(a: number, b: number, epsilon = 1e-6): boolean {
    return Math.abs(a - b) <= epsilon;
  }

  /** 平滑阻尼插值。 */
  static smoothDamp(current: number, target: number, velocity: { value: number }, smoothTime: number, dt: number): number {
    const omega = 2 / smoothTime;
    const x = omega * dt;
    const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
    const change = current - target;
    const temp = (velocity.value + omega * change) * dt;
    velocity.value = (velocity.value - omega * temp) * exp;
    return target + (change + temp) * exp;
  }

  /** 计算两点之间的距离。 */
  static distance(x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /** 计算两点之间的角度（弧度）。 */
  static angle(x1: number, y1: number, x2: number, y2: number): number {
    return Math.atan2(y2 - y1, x2 - x1);
  }

  /** 检查数值是否为2的幂。 */
  static isPowerOfTwo(value: number): boolean {
    return (value & (value - 1)) === 0 && value > 0;
  }

  /** 获取大于等于value的最小2的幂。 */
  static nextPowerOfTwo(value: number): number {
    value--;
    value |= value >> 1;
    value |= value >> 2;
    value |= value >> 4;
    value |= value >> 8;
    value |= value >> 16;
    value++;
    return value;
  }
}