// 约束布局求解器：支持百分比、相对定位、固定约束、最小/最大尺寸。

import { UIWidget } from './UIWidget';

/** 约束类型 */
export type ConstraintType = 'left' | 'right' | 'top' | 'bottom' | 'centerX' | 'centerY' | 'width' | 'height' | 'aspectRatio';

/** 约束定义 */
export interface Constraint {
  /** 约束类型 */
  type: ConstraintType;
  /** 目标组件（null = 父容器） */
  target?: UIWidget;
  /** 目标属性 */
  targetAttribute?: ConstraintType;
  /** 系数值（乘以目标值） */
  multiplier?: number;
  /** 常量偏移 */
  constant?: number;
  /** 权重（用于冲突解决） */
  priority?: number;
}

/** 约束配置 */
export interface ConstraintConfig {
  /** 左边距约束 */
  left?: number | Constraint;
  /** 右边距约束 */
  right?: number | Constraint;
  /** 上边距约束 */
  top?: number | Constraint;
  /** 下边距约束 */
  bottom?: number | Constraint;
  /** 水平中心约束 */
  centerX?: number | Constraint;
  /** 垂直中心约束 */
  centerY?: number | Constraint;
  /** 宽度约束 */
  width?: number | Constraint;
  /** 高度约束 */
  height?: number | Constraint;
  /** 宽高比约束 */
  aspectRatio?: number;
  /** 最小宽度 */
  minWidth?: number;
  /** 最大宽度 */
  maxWidth?: number;
  /** 最小高度 */
  minHeight?: number;
  /** 最大高度 */
  maxHeight?: number;
}

/**
 * 约束布局求解器
 */
export class ConstraintSolver {
  private constraints = new Map<UIWidget, ConstraintConfig>();

  /** 添加约束 */
  setConstraints(widget: UIWidget, config: ConstraintConfig): void {
    this.constraints.set(widget, config);
  }

  /** 移除约束 */
  removeConstraints(widget: UIWidget): void {
    this.constraints.delete(widget);
  }

  /** 获取约束 */
  getConstraints(widget: UIWidget): ConstraintConfig | undefined {
    return this.constraints.get(widget);
  }

  /** 求解所有约束 */
  solve(parentWidth: number, parentHeight: number): void {
    // 多次迭代以处理依赖
    for (let iter = 0; iter < 3; iter++) {
      for (const [widget, config] of this.constraints) {
        if (!widget.visible) continue;
        this.solveWidget(widget, config, parentWidth, parentHeight);
      }
    }
  }

  /** 求解单个组件 */
  private solveWidget(
    widget: UIWidget,
    config: ConstraintConfig,
    parentWidth: number,
    parentHeight: number
  ): void {
    const left = this.resolveValue(config.left, widget, parentWidth, parentHeight);
    const right = this.resolveValue(config.right, widget, parentWidth, parentHeight);
    const top = this.resolveValue(config.top, widget, parentWidth, parentHeight);
    const bottom = this.resolveValue(config.bottom, widget, parentWidth, parentHeight);
    const centerX = this.resolveValue(config.centerX, widget, parentWidth, parentHeight);
    const centerY = this.resolveValue(config.centerY, widget, parentWidth, parentHeight);
    const width = this.resolveValue(config.width, widget, parentWidth, parentHeight);
    const height = this.resolveValue(config.height, widget, parentWidth, parentHeight);

    // 水平位置
    if (left !== null && right !== null) {
      widget.x = left;
      widget.width = parentWidth - left - right;
    } else if (left !== null) {
      widget.x = left;
      if (width !== null) widget.width = width;
    } else if (right !== null) {
      if (width !== null) {
        widget.x = parentWidth - right - width;
        widget.width = width;
      } else {
        widget.x = parentWidth - widget.width - right;
      }
    } else if (centerX !== null) {
      widget.x = parentWidth / 2 - widget.width * widget.anchorX + centerX;
    }

    // 垂直位置
    if (top !== null && bottom !== null) {
      widget.y = top;
      widget.height = parentHeight - top - bottom;
    } else if (top !== null) {
      widget.y = top;
      if (height !== null) widget.height = height;
    } else if (bottom !== null) {
      if (height !== null) {
        widget.y = parentHeight - bottom - height;
        widget.height = height;
      } else {
        widget.y = parentHeight - widget.height - bottom;
      }
    } else if (centerY !== null) {
      widget.y = parentHeight / 2 - widget.height * widget.anchorY + centerY;
    }

    // 宽高比
    if (config.aspectRatio !== undefined) {
      if (width !== null && height === null) {
        widget.height = widget.width / config.aspectRatio;
      } else if (height !== null && width === null) {
        widget.width = widget.height * config.aspectRatio;
      }
    }

    // 尺寸限制
    if (config.minWidth !== undefined) widget.width = Math.max(widget.width, config.minWidth);
    if (config.maxWidth !== undefined) widget.width = Math.min(widget.width, config.maxWidth);
    if (config.minHeight !== undefined) widget.height = Math.max(widget.height, config.minHeight);
    if (config.maxHeight !== undefined) widget.height = Math.min(widget.height, config.maxHeight);
  }

  private resolveValue(
    value: number | Constraint | undefined,
    _widget: UIWidget,
    parentWidth: number,
    parentHeight: number
  ): number | null {
    if (value === undefined) return null;

    if (typeof value === 'number') {
      return value;
    }

    // 约束求解
    const target = value.target;
    const targetValue = this.getTargetValue(target, value.targetAttribute, parentWidth, parentHeight);

    return targetValue * (value.multiplier ?? 1) + (value.constant ?? 0);
  }

  private getTargetValue(
    target: UIWidget | undefined,
    attribute: ConstraintType | undefined,
    parentWidth: number,
    parentHeight: number
  ): number {
    if (!target) {
      // 使用父容器值
      switch (attribute) {
        case 'width': return parentWidth;
        case 'height': return parentHeight;
        case 'left': return 0;
        case 'right': return parentWidth;
        case 'top': return 0;
        case 'bottom': return parentHeight;
        case 'centerX': return parentWidth / 2;
        case 'centerY': return parentHeight / 2;
        default: return 0;
      }
    }

    switch (attribute) {
      case 'width': return target.width;
      case 'height': return target.height;
      case 'left': return target.x;
      case 'right': return target.x + target.width;
      case 'top': return target.y;
      case 'bottom': return target.y + target.height;
      case 'centerX': return target.x + target.width / 2;
      case 'centerY': return target.y + target.height / 2;
      default: return 0;
    }
  }

  /** 清除所有约束 */
  clear(): void {
    this.constraints.clear();
  }
}

// ========== 便捷约束创建 ==========

/** 创建固定边距约束 */
export function constraintMargins(
  top?: number,
  right?: number,
  bottom?: number,
  left?: number
): ConstraintConfig {
  return { top, right, bottom, left };
}

/** 创建居中约束 */
export function constraintCenter(offsetX = 0, offsetY = 0): ConstraintConfig {
  return { centerX: offsetX, centerY: offsetY };
}

/** 创建固定尺寸约束 */
export function constraintSize(width: number, height: number): ConstraintConfig {
  return { width, height };
}

/** 创建填充约束（拉伸到父容器） */
export function constraintFill(margin = 0): ConstraintConfig {
  return {
    left: margin,
    right: margin,
    top: margin,
    bottom: margin,
  };
}

/** 创建相对约束（相对另一个组件） */
export function constraintRelative(
  target: UIWidget,
  attribute: ConstraintType,
  multiplier = 1,
  constant = 0
): Constraint {
  return { type: attribute, target, multiplier, constant };
}
