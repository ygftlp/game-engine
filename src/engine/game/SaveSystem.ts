// 存档系统：支持游戏存档、读档、自动保存、存档槽位管理。

import { IPlatform } from '../platform/Platform';

/** 存档数据 */
export interface SaveData {
  /** 存档版本 */
  version: number;
  /** 存档时间戳 */
  timestamp: number;
  /** 游戏状态 */
  gameState: Record<string, unknown>;
  /** 玩家数据 */
  playerData: Record<string, unknown>;
  /** 关卡数据 */
  levelData: Record<string, unknown>;
  /** 统计数据 */
  stats: Record<string, unknown>;
  /** 元数据 */
  meta?: {
    slotName?: string;
    playTime?: number;
    screenshot?: string;
  };
}

/** 存档配置 */
export interface SaveConfig {
  /** 存档键前缀 */
  prefix: string;
  /** 最大存档槽位数 */
  maxSlots: number;
  /** 是否启用自动保存 */
  autoSave: boolean;
  /** 自动保存间隔（秒） */
  autoSaveInterval: number;
  /** 是否压缩存档 */
  compress: boolean;
}

const DEFAULT_SAVE_CONFIG: SaveConfig = {
  prefix: 'game_save_',
  maxSlots: 5,
  autoSave: true,
  autoSaveInterval: 300,
  compress: false,
};

/**
 * 存档管理器
 */
export class SaveManager {
  private platform: IPlatform;
  private config: SaveConfig;
  private autoSaveTimer = 0;
  private currentSlot = 0;

  constructor(platform: IPlatform, config?: Partial<SaveConfig>) {
    this.platform = platform;
    this.config = { ...DEFAULT_SAVE_CONFIG, ...config };
  }

  /** 保存游戏到指定槽位 */
  save(slot: number, data: SaveData): boolean {
    try {
      data.timestamp = Date.now();
      data.version = data.version ?? 1;

      const json = JSON.stringify(data);
      const key = this.getSlotKey(slot);

      this.platform.setStorage(key, json);

      // 更新槽位列表
      this.updateSlotList(slot, data);

      return true;
    } catch (e) {
      console.error('Save failed:', e);
      return false;
    }
  }

  /** 从指定槽位加载游戏 */
  load(slot: number): SaveData | null {
    try {
      const key = this.getSlotKey(slot);
      const json = this.platform.getStorage(key);

      if (!json) return null;

      const data = JSON.parse(json) as SaveData;
      this.currentSlot = slot;
      return data;
    } catch (e) {
      console.error('Load failed:', e);
      return null;
    }
  }

  /** 删除指定槽位 */
  delete(slot: number): boolean {
    try {
      const key = this.getSlotKey(slot);
      this.platform.removeStorage(key);

      // 更新槽位列表
      this.removeSlotFromList(slot);

      return true;
    } catch (e) {
      console.error('Delete failed:', e);
      return false;
    }
  }

  /** 检查槽位是否有存档 */
  hasSave(slot: number): boolean {
    const key = this.getSlotKey(slot);
    return this.platform.getStorage(key) !== null;
  }

  /** 获取所有存档槽位信息 */
  getSlots(): Array<{ slot: number; exists: boolean; meta?: SaveData['meta']; timestamp?: number }> {
    const slots: Array<{ slot: number; exists: boolean; meta?: SaveData['meta']; timestamp?: number }> = [];

    for (let i = 0; i < this.config.maxSlots; i++) {
      const key = this.getSlotKey(i);
      const json = this.platform.getStorage(key);

      if (json) {
        try {
          const data = JSON.parse(json) as SaveData;
          slots.push({
            slot: i,
            exists: true,
            meta: data.meta,
            timestamp: data.timestamp,
          });
        } catch {
          slots.push({ slot: i, exists: false });
        }
      } else {
        slots.push({ slot: i, exists: false });
      }
    }

    return slots;
  }

  /** 获取当前槽位 */
  getCurrentSlot(): number {
    return this.currentSlot;
  }

  /** 设置当前槽位 */
  setCurrentSlot(slot: number): void {
    this.currentSlot = slot;
  }

  /** 自动保存（需手动调用） */
  updateAutoSave(dt: number, dataFactory: () => SaveData): boolean {
    if (!this.config.autoSave) return false;

    this.autoSaveTimer += dt;
    if (this.autoSaveTimer >= this.config.autoSaveInterval) {
      this.autoSaveTimer = 0;
      const data = dataFactory();
      return this.save(this.currentSlot, data);
    }
    return false;
  }

  /** 手动触发自动保存 */
  triggerAutoSave(dataFactory: () => SaveData): boolean {
    const data = dataFactory();
    return this.save(this.currentSlot, data);
  }

  /** 导出存档为字符串 */
  exportSave(slot: number): string | null {
    const key = this.getSlotKey(slot);
    return this.platform.getStorage(key);
  }

  /** 从字符串导入存档 */
  importSave(slot: number, json: string): boolean {
    try {
      JSON.parse(json); // 验证 JSON 格式
      const key = this.getSlotKey(slot);
      this.platform.setStorage(key, json);
      return true;
    } catch {
      return false;
    }
  }

  /** 获取存档统计 */
  getStats(): { totalSlots: number; usedSlots: number; freeSlots: number } {
    const slots = this.getSlots();
    const used = slots.filter(s => s.exists).length;
    return {
      totalSlots: this.config.maxSlots,
      usedSlots: used,
      freeSlots: this.config.maxSlots - used,
    };
  }

  private getSlotKey(slot: number): string {
    return `${this.config.prefix}${slot}`;
  }

  private updateSlotList(slot: number, data: SaveData): void {
    const listKey = `${this.config.prefix}list`;
    const json = this.platform.getStorage(listKey);
    const list: Record<number, { timestamp: number; meta?: SaveData['meta'] }> = json ? JSON.parse(json) : {};

    list[slot] = {
      timestamp: data.timestamp,
      meta: data.meta,
    };

    this.platform.setStorage(listKey, JSON.stringify(list));
  }

  private removeSlotFromList(slot: number): void {
    const listKey = `${this.config.prefix}list`;
    const json = this.platform.getStorage(listKey);
    if (!json) return;

    const list: Record<number, unknown> = JSON.parse(json);
    delete list[slot];

    this.platform.setStorage(listKey, JSON.stringify(list));
  }
}

/**
 * 快速存档工具
 */
export class QuickSave {
  private saveManager: SaveManager;
  private quickSlot: number;

  constructor(saveManager: SaveManager, quickSlot = 0) {
    this.saveManager = saveManager;
    this.quickSlot = quickSlot;
  }

  /** 快速保存 */
  quickSave(data: SaveData): boolean {
    return this.saveManager.save(this.quickSlot, data);
  }

  /** 快速加载 */
  quickLoad(): SaveData | null {
    return this.saveManager.load(this.quickSlot);
  }

  /** 是否有快速存档 */
  hasQuickSave(): boolean {
    return this.saveManager.hasSave(this.quickSlot);
  }
}
