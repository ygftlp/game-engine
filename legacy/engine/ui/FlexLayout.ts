// Flex 布局增强版：支持 wrap 换行、grow/shrink 弹性伸缩、嵌套、脏标记自动布局。
import { UIWidget } from './UIWidget';

/** Flex 方向 */
export type FlexDirection = 'row' | 'row-reverse' | 'column' | 'column-reverse';

/** 主轴对齐 */
export type FlexJustify = 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';

/** 交叉轴对齐 */
export type FlexAlign = 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';

/** 换行方式 */
export type FlexWrap = 'nowrap' | 'wrap' | 'wrap-reverse';

/** Flex 子项配置 */
export interface FlexItemConfig {
  /** 弹性伸展比例（默认 0） */
  grow?: number;
  /** 弹性收缩比例（默认 1） */
  shrink?: number;
  /** 固定基础尺寸 */
  basis?: number;
  /** 交叉轴对齐（覆盖容器设置） */
  alignSelf?: FlexAlign;
  /** 顺序（数字小的在前） */
  order?: number;
  /** 外边距 */
  margin?: { top?: number; right?: number; bottom?: number; left?: number };
}

/** Flex 容器配置 */
export interface FlexContainerConfig {
  /** 主轴方向 */
  direction?: FlexDirection;
  /** 主轴对齐 */
  justify?: FlexJustify;
  /** 交叉轴对齐 */
  align?: FlexAlign;
  /** 换行方式 */
  wrap?: FlexWrap;
  /** 子项间距 */
  gap?: number;
  /** 行间距（换行时） */
  rowGap?: number;
  /** 容器内边距 */
  padding?: { top?: number; right?: number; bottom?: number; left?: number };
  /** 容器宽度（固定或百分比） */
  width?: number;
  /** 容器高度（固定或百分比） */
  height?: number;
  /** 是否自动尺寸（根据子项计算） */
  autoSize?: boolean;
}

/** Flex 行信息 */
interface FlexLine {
  items: FlexItem[];
  mainSize: number;
  crossSize: number;
}

/** Flex 子项信息 */
interface FlexItem {
  widget: UIWidget;
  config: FlexItemConfig;
  mainSize: number;
  crossSize: number;
  mainOffset: number;
  crossOffset: number;
}

/**
 * Flex 布局引擎：完整实现 CSS Flexbox 核心功能。
 */
export class FlexLayout {
  private config: Required<FlexContainerConfig>;
  private children: UIWidget[] = [];
  private itemConfigs = new Map<UIWidget, FlexItemConfig>();
  private _dirty = true;
  private computedWidth = 0;
  private computedHeight = 0;

  constructor(config?: FlexContainerConfig) {
    this.config = {
      direction: 'row',
      justify: 'flex-start',
      align: 'stretch',
      wrap: 'nowrap',
      gap: 0,
      rowGap: 0,
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      width: 0,
      height: 0,
      autoSize: false,
      ...config,
    };
    if (typeof this.config.padding === 'number') {
      const p = this.config.padding as any;
      this.config.padding = { top: p, right: p, bottom: p, left: p };
    }
  }

  /** 添加子组件 */
  addChild(child: UIWidget, itemConfig?: FlexItemConfig): void {
    this.children.push(child);
    if (itemConfig) {
      this.itemConfigs.set(child, itemConfig);
    }
    this._dirty = true;
  }

  /** 移除子组件 */
  removeChild(child: UIWidget): void {
    const idx = this.children.indexOf(child);
    if (idx >= 0) {
      this.children.splice(idx, 1);
      this.itemConfigs.delete(child);
      this._dirty = true;
    }
  }

  /** 设置子组件配置 */
  setItemConfig(child: UIWidget, config: FlexItemConfig): void {
    this.itemConfigs.set(child, config);
    this._dirty = true;
  }

  /** 更新容器配置 */
  updateConfig(config: Partial<FlexContainerConfig>): void {
    Object.assign(this.config, config);
    this._dirty = true;
  }

  /** 标记布局需要重新计算 */
  markDirty(): void {
    this._dirty = true;
  }

  /** 是否需要重新布局 */
  isDirty(): boolean {
    return this._dirty;
  }

  /** 获取子组件列表 */
  getChildren(): readonly UIWidget[] {
    return this.children;
  }

  /** 应用布局 */
  applyLayout(containerWidth?: number, containerHeight?: number): void {
    if (!this._dirty && containerWidth === undefined && containerHeight === undefined) {
      return;
    }

    const dir = this.config.direction;
    const wrap = this.config.wrap;
    const justify = this.config.justify;
    const align = this.config.align;
    const gap = this.config.gap;
    const rowGap = this.config.rowGap ?? gap;
    const pad = this.config.padding ?? { top: 0, right: 0, bottom: 0, left: 0 };
    const padTop = pad.top ?? 0;
    const padRight = pad.right ?? 0;
    const padBottom = pad.bottom ?? 0;
    const padLeft = pad.left ?? 0;

    const isRow = dir === 'row' || dir === 'row-reverse';

    // 容器可用尺寸
    const containerMainSize = (isRow ? containerWidth : containerHeight) ?? this.config.width;
    const containerCrossSize = (isRow ? containerHeight : containerWidth) ?? this.config.height;

    // 收集可见子项并排序
    const items: FlexItem[] = this.children
      .filter(c => c.visible)
      .sort((a, b) => {
        const ac = this.itemConfigs.get(a);
        const bc = this.itemConfigs.get(b);
        return (ac?.order ?? 0) - (bc?.order ?? 0);
      })
      .map(widget => {
        const cfg = this.itemConfigs.get(widget) ?? {};
        const mainSize = isRow ? widget.width : widget.height;
        const crossSize = isRow ? widget.height : widget.width;
        return {
          widget,
          config: cfg,
          mainSize: cfg.basis ?? mainSize,
          crossSize,
          mainOffset: 0,
          crossOffset: 0,
        };
      });

    if (items.length === 0) {
      this.computedWidth = 0;
      this.computedHeight = 0;
      this._dirty = false;
      return;
    }

    // 按行分组
    const lines: FlexLine[] = [];
    let currentLine: FlexItem[] = [];
    let currentMainSize = 0;
    let maxCrossSize = 0;

    for (const item of items) {
      const itemGap = currentLine.length > 0 ? gap : 0;

      if (wrap !== 'nowrap' && currentMainSize + item.mainSize + itemGap > containerMainSize && currentLine.length > 0) {
        lines.push({ items: currentLine, mainSize: currentMainSize, crossSize: maxCrossSize });
        currentLine = [];
        currentMainSize = 0;
        maxCrossSize = 0;
      }

      currentLine.push(item);
      currentMainSize += item.mainSize + itemGap;
      maxCrossSize = Math.max(maxCrossSize, item.crossSize);
    }

    if (currentLine.length > 0) {
      lines.push({ items: currentLine, mainSize: currentMainSize, crossSize: maxCrossSize });
    }

    // 计算交叉轴总尺寸
    let totalCrossSize = 0;
    for (let i = 0; i < lines.length; i++) {
      totalCrossSize += lines[i].crossSize;
      if (i > 0) totalCrossSize += rowGap;
    }

    // 自动尺寸
    if (this.config.autoSize) {
      this.computedWidth = isRow ? containerMainSize : totalCrossSize;
      this.computedHeight = isRow ? totalCrossSize : containerMainSize;
    }

    // 计算每行的子项位置
    let crossOffset = padTop;

    for (const line of lines) {
      // 计算行内 grow/shrink
      this.resolveLineItems(line, containerMainSize - padLeft - padRight);

      // 主轴分布
      this.distributeMainAxis(line, containerMainSize - padLeft - padRight, justify);

      // 交叉轴对齐
      this.alignCrossAxis(line, containerCrossSize - padTop - padBottom, align);

      // 应用偏移
      const isWrapReverse = wrap === 'wrap-reverse';
      for (const item of line.items) {
        if (isRow) {
          item.widget.x = item.mainOffset + padLeft + item.widget.anchorX * item.widget.width;
          item.widget.y = (isWrapReverse ? containerCrossSize - crossOffset - line.crossSize : crossOffset + item.crossOffset) + item.widget.anchorY * item.widget.height;
        } else {
          item.widget.x = (isWrapReverse ? containerCrossSize - crossOffset - line.crossSize : crossOffset + item.crossOffset) + item.widget.anchorX * item.widget.width;
          item.widget.y = item.mainOffset + padTop + item.widget.anchorY * item.widget.height;
        }
      }

      crossOffset += line.crossSize + rowGap;
    }

    this._dirty = false;
  }

  /** 获取计算后的尺寸 */
  getComputedSize(): { width: number; height: number } {
    return { width: this.computedWidth, height: this.computedHeight };
  }

  private resolveLineItems(line: FlexLine, availableMainSize: number): void {
    let totalGrow = 0;
    let totalShrink = 0;
    let totalSize = 0;

    for (const item of line.items) {
      totalGrow += item.config.grow ?? 0;
      totalShrink += item.config.shrink ?? 1;
      totalSize += item.mainSize;
    }

    const freeSpace = availableMainSize - totalSize;

    // Grow
    if (freeSpace > 0 && totalGrow > 0) {
      for (const item of line.items) {
        const grow = item.config.grow ?? 0;
        item.mainSize += (freeSpace * grow) / totalGrow;
      }
    }

    // Shrink
    if (freeSpace < 0 && totalShrink > 0) {
      for (const item of line.items) {
        const shrink = item.config.shrink ?? 1;
        item.mainSize += (freeSpace * shrink) / totalShrink;
        item.mainSize = Math.max(0, item.mainSize);
      }
    }
  }

  private distributeMainAxis(line: FlexLine, availableMainSize: number, justify: FlexJustify): void {
    const items = line.items;
    const totalSize = items.reduce((sum, item) => sum + item.mainSize, 0);
    const gap = this.config.gap;
    const itemGap = items.length > 1 ? gap : 0;
    const totalGaps = itemGap * (items.length - 1);

    let offset = 0;
    let spacing = 0;

    switch (justify) {
      case 'flex-start':
        break;
      case 'flex-end':
        offset = availableMainSize - totalSize - totalGaps;
        break;
      case 'center':
        offset = (availableMainSize - totalSize - totalGaps) / 2;
        break;
      case 'space-between':
        spacing = items.length > 1 ? (availableMainSize - totalSize) / (items.length - 1) : 0;
        break;
      case 'space-around':
        spacing = items.length > 0 ? (availableMainSize - totalSize) / items.length : 0;
        offset = spacing / 2;
        break;
      case 'space-evenly':
        spacing = items.length > 0 ? (availableMainSize - totalSize) / (items.length + 1) : 0;
        offset = spacing;
        break;
    }

    for (const item of items) {
      item.mainOffset = offset;
      offset += item.mainSize + spacing + itemGap;
    }
  }

  private alignCrossAxis(line: FlexLine, availableCrossSize: number, align: FlexAlign): void {
    const items = line.items;
    const lineCrossSize = line.crossSize;

    for (const item of items) {
      const alignSelf = item.config.alignSelf ?? align;

      switch (alignSelf) {
        case 'flex-start':
          item.crossOffset = 0;
          break;
        case 'flex-end':
          item.crossOffset = availableCrossSize - item.crossSize;
          break;
        case 'center':
          item.crossOffset = (availableCrossSize - item.crossSize) / 2;
          break;
        case 'stretch':
          item.crossSize = lineCrossSize;
          break;
      }
    }
  }
}
