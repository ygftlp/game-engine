// Tilemap 瓦片地图系统：支持瓦片加载、地图渲染、碰撞配置、视锥裁剪
import { Node } from '../core/Node';
import { Renderer } from '../render/Renderer';
import { Texture } from '../render/Texture';
import { Loader } from '../loader/Loader';
import { Collision, Rect } from '../collision/Collision';

/** 瓦片集配置 */
export interface TilesetConfig {
  /** 纹理 */
  texture: Texture;
  /** 瓦片宽度 */
  tileWidth: number;
  /** 瓦片高度 */
  tileHeight: number;
  /** 瓦片间距 */
  spacing?: number;
  /** 瓦片边距 */
  margin?: number;
  /** 首个瓦片ID */
  firstGid?: number;
}

/** 瓦片层配置 */
export interface TileLayerConfig {
  /** 层名称 */
  name: string;
  /** 瓦片数据（二维数组，0表示空） */
  data: number[][];
  /** 是否可见 */
  visible?: boolean;
  /** 透明度 */
  opacity?: number;
  /** 偏移X */
  offsetX?: number;
  /** 偏移Y */
  offsetY?: number;
}

/** 碰撞体配置 */
export interface TileCollision {
  /** 瓦片ID */
  tileId: number;
  /** 碰撞矩形（相对于瓦片） */
  rect: Rect;
}

/** 瓦片集 */
export class Tileset {
  readonly texture: Texture;
  readonly tileWidth: number;
  readonly tileHeight: number;
  readonly spacing: number;
  readonly margin: number;
  readonly firstGid: number;
  readonly columns: number;
  readonly tileCount: number;

  constructor(config: TilesetConfig) {
    this.texture = config.texture;
    this.tileWidth = config.tileWidth;
    this.tileHeight = config.tileHeight;
    this.spacing = config.spacing ?? 0;
    this.margin = config.margin ?? 0;
    this.firstGid = config.firstGid ?? 1;

    // 计算瓦片数量
    const texWidth = this.texture.width - this.margin * 2 + this.spacing;
    const texHeight = this.texture.height - this.margin * 2 + this.spacing;
    this.columns = Math.floor(texWidth / (this.tileWidth + this.spacing));
    const rows = Math.floor(texHeight / (this.tileHeight + this.spacing));
    this.tileCount = this.columns * rows;
  }

  /**
   * 获取瓦片在纹理中的区域
   */
  getTileRect(tileId: number): { x: number; y: number; width: number; height: number } | null {
    const localId = tileId - this.firstGid;
    if (localId < 0 || localId >= this.tileCount) return null;

    const col = localId % this.columns;
    const row = Math.floor(localId / this.columns);

    return {
      x: this.margin + col * (this.tileWidth + this.spacing),
      y: this.margin + row * (this.tileHeight + this.spacing),
      width: this.tileWidth,
      height: this.tileHeight,
    };
  }
}

/** 瓦片层 */
export class TileLayer {
  readonly name: string;
  readonly data: number[][];
  visible: boolean;
  opacity: number;
  offsetX: number;
  offsetY: number;

  constructor(config: TileLayerConfig) {
    this.name = config.name;
    this.data = config.data;
    this.visible = config.visible ?? true;
    this.opacity = config.opacity ?? 1;
    this.offsetX = config.offsetX ?? 0;
    this.offsetY = config.offsetY ?? 0;
  }

  /**
   * 获取指定位置的瓦片ID
   */
  getTileAt(col: number, row: number): number {
    if (row < 0 || row >= this.data.length) return 0;
    if (col < 0 || col >= this.data[row].length) return 0;
    return this.data[row][col];
  }

  /**
   * 设置指定位置的瓦片
   */
  setTileAt(col: number, row: number, tileId: number): void {
    if (row >= 0 && row < this.data.length) {
      if (col >= 0 && col < this.data[row].length) {
        this.data[row][col] = tileId;
      }
    }
  }

  /**
   * 获取地图尺寸
   */
  getSize(): { columns: number; rows: number } {
    const rows = this.data.length;
    const columns = rows > 0 ? this.data[0].length : 0;
    return { columns, rows };
  }
}

/** 碰撞对象 */
export interface TiledObject {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type?: string;
  properties?: Record<string, any>;
}

/**
 * Tilemap 节点
 */
export class Tilemap extends Node {
  private tileset: Tileset | null = null;
  private layers: TileLayer[] = [];
  private collisionMap: Map<number, Rect[]> = new Map();
  private objects: TiledObject[] = [];

  /** 地图列数 */
  columns = 0;
  /** 地图行数 */
  rows = 0;
  /** 瓦片宽度 */
  tileWidth = 0;
  /** 瓦片高度 */
  tileHeight = 0;

  /**
   * 设置瓦片集
   */
  setTileset(tileset: Tileset): void {
    this.tileset = tileset;
    this.tileWidth = tileset.tileWidth;
    this.tileHeight = tileset.tileHeight;
  }

  /**
   * 添加瓦片层
   */
  addLayer(layer: TileLayer): void {
    this.layers.push(layer);
    const size = layer.getSize();
    this.columns = Math.max(this.columns, size.columns);
    this.rows = Math.max(this.rows, size.rows);
  }

  /**
   * 获取层
   */
  getLayer(name: string): TileLayer | undefined {
    return this.layers.find(l => l.name === name);
  }

  /**
   * 获取所有层
   */
  getLayers(): TileLayer[] {
    return [...this.layers];
  }

  /**
   * 设置瓦片碰撞
   */
  setTileCollision(tileId: number, rects: Rect[]): void {
    this.collisionMap.set(tileId, rects);
  }

  /**
   * 添加碰撞对象
   */
  addObject(obj: TiledObject): void {
    this.objects.push(obj);
  }

  /**
   * 获取碰撞对象
   */
  getObjects(): TiledObject[] {
    return [...this.objects];
  }

  /**
   * 获取指定位置的瓦片是否可碰撞
   */
  isCollidable(col: number, row: number): boolean {
    for (const layer of this.layers) {
      const tileId = layer.getTileAt(col, row);
      if (tileId > 0 && this.collisionMap.has(tileId)) {
        return true;
      }
    }
    return false;
  }

  /**
   * 世界坐标转瓦片坐标
   */
  worldToTile(worldX: number, worldY: number): { col: number; row: number } {
    return {
      col: Math.floor(worldX / this.tileWidth),
      row: Math.floor(worldY / this.tileHeight),
    };
  }

  /**
   * 瓦片坐标转世界坐标
   */
  tileToWorld(col: number, row: number): { x: number; y: number } {
    return {
      x: col * this.tileWidth,
      y: row * this.tileHeight,
    };
  }

  /**
   * 检测矩形碰撞
   */
  checkCollision(rect: Rect): boolean {
    const left = Math.floor(rect.x / this.tileWidth);
    const top = Math.floor(rect.y / this.tileHeight);
    const right = Math.floor((rect.x + rect.width) / this.tileWidth);
    const bottom = Math.floor((rect.y + rect.height) / this.tileHeight);

    for (let row = top; row <= bottom; row++) {
      for (let col = left; col <= right; col++) {
        if (this.isCollidable(col, row)) {
          const tileRect: Rect = {
            x: col * this.tileWidth,
            y: row * this.tileHeight,
            width: this.tileWidth,
            height: this.tileHeight,
          };
          if (Collision.rectIntersect(rect, tileRect)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  /**
   * 渲染地图（带视锥裁剪）
   */
  protected draw(renderer: Renderer): void {
    if (!this.tileset) return;

    const ctx = renderer.ctx;
    const img = this.tileset.texture.image as unknown as CanvasImageSource;

    // 计算可见区域（视锥裁剪）
    const viewport = renderer.ctx.getTransform();
    const viewLeft = -viewport.e / viewport.a;
    const viewTop = -viewport.f / viewport.d;
    const viewRight = viewLeft + renderer.width / viewport.a;
    const viewBottom = viewTop + renderer.height / viewport.d;

    // 计算可见瓦片范围
    const startCol = Math.max(0, Math.floor(viewLeft / this.tileWidth));
    const startRow = Math.max(0, Math.floor(viewTop / this.tileHeight));
    const endCol = Math.min(this.columns - 1, Math.ceil(viewRight / this.tileWidth));
    const endRow = Math.min(this.rows - 1, Math.ceil(viewBottom / this.tileHeight));

    // 渲染每一层
    for (const layer of this.layers) {
      if (!layer.visible) continue;

      ctx.save();
      ctx.globalAlpha = layer.opacity;

      for (let row = startRow; row <= endRow; row++) {
        for (let col = startCol; col <= endCol; col++) {
          const tileId = layer.getTileAt(col, row);
          if (tileId <= 0) continue;

          const tileRect = this.tileset.getTileRect(tileId);
          if (!tileRect) continue;

          const x = col * this.tileWidth + layer.offsetX;
          const y = row * this.tileHeight + layer.offsetY;

          ctx.drawImage(
            img,
            tileRect.x, tileRect.y, tileRect.width, tileRect.height,
            x, y, this.tileWidth, this.tileHeight
          );
        }
      }

      ctx.restore();
    }
  }
}

/**
 * 从JSON加载Tilemap
 */
export async function loadTilemapFromJson(
  url: string,
  loader: Loader
): Promise<Tilemap> {
  const data = await loader.loadJSON<any>(url);
  const tilemap = new Tilemap();

  // 加载瓦片集
  if (data.tilesets && data.tilesets.length > 0) {
    const tsData = data.tilesets[0];
    const texture = await loader.loadTexture(tsData.image);
    const tileset = new Tileset({
      texture,
      tileWidth: tsData.tilewidth,
      tileHeight: tsData.tileheight,
      spacing: tsData.spacing,
      margin: tsData.margin,
      firstGid: tsData.firstgid,
    });
    tilemap.setTileset(tileset);
  }

  // 加载层
  if (data.layers) {
    for (const layerData of data.layers) {
      if (layerData.type === 'tilelayer') {
        // 转换一维数组为二维
        const rows: number[][] = [];
        for (let r = 0; r < layerData.height; r++) {
          const row = layerData.data.slice(r * layerData.width, (r + 1) * layerData.width);
          rows.push(row);
        }

        const layer = new TileLayer({
          name: layerData.name,
          data: rows,
          visible: layerData.visible !== false,
          opacity: layerData.opacity ?? 1,
          offsetX: layerData.offsetx ?? 0,
          offsetY: layerData.offsety ?? 0,
        });
        tilemap.addLayer(layer);
      } else if (layerData.type === 'objectgroup') {
        // 加载碰撞对象
        for (const obj of layerData.objects) {
          tilemap.addObject({
            id: obj.id,
            x: obj.x,
            y: obj.y,
            width: obj.width,
            height: obj.height,
            type: obj.type,
            properties: obj.properties,
          });
        }
      }
    }
  }

  return tilemap;
}

/**
 * 创建简单的瓦片地图
 */
export function createSimpleTilemap(
  columns: number,
  rows: number,
  tileWidth: number,
  tileHeight: number,
  fillTileId: number = 1
): Tilemap {
  const tilemap = new Tilemap();
  tilemap.columns = columns;
  tilemap.rows = rows;
  tilemap.tileWidth = tileWidth;
  tilemap.tileHeight = tileHeight;

  // 创建填充层
  const data: number[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: number[] = [];
    for (let c = 0; c < columns; c++) {
      row.push(fillTileId);
    }
    data.push(row);
  }

  const layer = new TileLayer({
    name: 'main',
    data,
  });
  tilemap.addLayer(layer);

  return tilemap;
}