// 音频总线系统：支持混音、音量控制、静音、分组管理。
import { IAudio } from '../platform/Platform';

/** 音频总线节点 */
export interface BusNode {
  id: string;
  gain: number;
  muted: boolean;
  children: Set<string>;
  parent: string | null;
}

/**
 * 音频总线：树形混音架构，支持分组音量控制。
 *
 * 使用示例：
 *   const mixer = new AudioMixer();
 *   mixer.createBus('master');
 *   mixer.createBus('music', 'master');
 *   mixer.createBus('sfx', 'master');
 *   mixer.createBus('voice', 'master');
 *   mixer.setBusVolume('music', 0.8);
 *   mixer.muteBus('sfx');
 */
export class AudioMixer {
  private buses = new Map<string, BusNode>();
  private instances = new Map<string, { audio: IAudio; bus: string }>();

  constructor() {
    this.createBus('master');
  }

  /** 创建音频总线 */
  createBus(id: string, parentId = 'master'): BusNode {
    const bus: BusNode = {
      id,
      gain: 1,
      muted: false,
      children: new Set(),
      parent: parentId,
    };
    this.buses.set(id, bus);

    const parent = this.buses.get(parentId);
    if (parent) {
      parent.children.add(id);
    }

    return bus;
  }

  /** 删除音频总线 */
  removeBus(id: string): void {
    if (id === 'master') return;
    const bus = this.buses.get(id);
    if (!bus) return;

    // 移除子总线
    for (const childId of bus.children) {
      this.removeBus(childId);
    }

    // 从父总线移除
    if (bus.parent) {
      const parent = this.buses.get(bus.parent);
      parent?.children.delete(id);
    }

    this.buses.delete(id);
  }

  /** 设置总线音量（0-1） */
  setBusVolume(id: string, volume: number): void {
    const bus = this.buses.get(id);
    if (bus) {
      bus.gain = Math.max(0, Math.min(1, volume));
      this.updateAllVolumes();
    }
  }

  /** 获取总线音量 */
  getBusVolume(id: string): number {
    return this.buses.get(id)?.gain ?? 1;
  }

  /** 静音总线 */
  muteBus(id: string): void {
    const bus = this.buses.get(id);
    if (bus) {
      bus.muted = true;
      this.updateAllVolumes();
    }
  }

  /** 取消静音总线 */
  unmuteBus(id: string): void {
    const bus = this.buses.get(id);
    if (bus) {
      bus.muted = false;
      this.updateAllVolumes();
    }
  }

  /** 切换总线静音 */
  toggleMuteBus(id: string): void {
    const bus = this.buses.get(id);
    if (bus) {
      bus.muted = !bus.muted;
      this.updateAllVolumes();
    }
  }

  /** 注册音频实例到总线 */
  registerInstance(id: string, audio: IAudio, bus = 'master'): void {
    this.instances.set(id, { audio, bus });
    this.updateInstanceVolume(id);
  }

  /** 注销音频实例 */
  unregisterInstance(id: string): void {
    this.instances.delete(id);
  }

  /** 获取最终音量（沿总线链计算） */
  getFinalVolume(busId: string): number {
    const bus = this.buses.get(busId);
    if (!bus) return 1;

    let volume = bus.gain;
    if (bus.muted) return 0;

    if (bus.parent) {
      volume *= this.getFinalVolume(bus.parent);
    }

    return volume;
  }

  /** 更新所有音频实例音量 */
  private updateAllVolumes(): void {
    for (const id of this.instances.keys()) {
      this.updateInstanceVolume(id);
    }
  }

  /** 更新单个实例音量 */
  private updateInstanceVolume(id: string): void {
    const inst = this.instances.get(id);
    if (!inst) return;
    const finalVolume = this.getFinalVolume(inst.bus);
    inst.audio.volume = finalVolume;
  }

  /** 获取统计信息 */
  getStats(): { buses: number; instances: number } {
    return {
      buses: this.buses.size,
      instances: this.instances.size,
    };
  }
}
