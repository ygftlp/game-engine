// 音频特效：低通/高通/变调/回声等音频处理效果。

/** 音频效果类型 */
export type AudioEffectType = 'lowpass' | 'highpass' | 'bandpass' | 'pitch' | 'echo' | 'compressor';

/** 音频效果配置 */
export interface AudioEffectConfig {
  type: AudioEffectType;
  enabled?: boolean;
  /** 低通/高通/带通：截止频率 Hz */
  frequency?: number;
  /** 低通/高通/带通：Q 值 */
  Q?: number;
  /** 变调：音高倍率（1=原速，2=两倍速） */
  pitchRate?: number;
  /** 回声：延迟时间（秒） */
  delayTime?: number;
  /** 回声：衰减比 */
  decay?: number;
  /** 回声：干湿比 */
  wetDry?: number;
  /** 压缩器：阈值 dB */
  threshold?: number;
  /** 压缩器：压缩比 */
  ratio?: number;
  /** 压缩器：攻击时间（秒） */
  attack?: number;
  /** 压缩器：释放时间（秒） */
  release?: number;
}

/**
 * 音频效果链：串联多个效果器。
 *
 * 使用示例：
 *   const chain = new AudioEffectChain();
 *   chain.addEffect({ type: 'lowpass', frequency: 2000 });
 *   chain.addEffect({ type: 'echo', delayTime: 0.3, decay: 0.5 });
 *   chain.applyTo(audioElement);
 */
export class AudioEffectChain {
  private effects: AudioEffectConfig[] = [];
  private audioContext: AudioContext | null = null;
  private nodes: AudioNode[] = [];
  private sourceNode: MediaElementAudioSourceNode | null = null;

  /** 添加效果 */
  addEffect(config: AudioEffectConfig): number {
    this.effects.push(config);
    this.rebuild();
    return this.effects.length - 1;
  }

  /** 移除效果 */
  removeEffect(index: number): void {
    this.effects.splice(index, 1);
    this.rebuild();
  }

  /** 更新效果参数 */
  updateEffect(index: number, config: Partial<AudioEffectConfig>): void {
    if (index >= 0 && index < this.effects.length) {
      Object.assign(this.effects[index], config);
      this.rebuild();
    }
  }

  /** 启用/禁用效果 */
  setEnabled(index: number, enabled: boolean): void {
    if (index >= 0 && index < this.effects.length) {
      this.effects[index].enabled = enabled;
      this.rebuild();
    }
  }

  /** 应用到 HTML 音频元素 */
  applyTo(audioElement: HTMLAudioElement): void {
    if (typeof AudioContext === 'undefined') {
      throw new Error('AudioEffectChain requires AudioContext (H5 platform only)');
    }
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }

    // 清理旧节点
    this.disconnect();

    // 创建源节点
    this.sourceNode = this.audioContext.createMediaElementSource(audioElement);

    // 构建效果链
    let lastNode: AudioNode = this.sourceNode;

    for (const effect of this.effects) {
      if (effect.enabled === false) continue;

      const node = this.createEffectNode(effect);
      if (node) {
        lastNode.connect(node);
        lastNode = node;
        this.nodes.push(node);
      }
    }

    // 连接到输出
    lastNode.connect(this.audioContext.destination);
  }

  /** 断开所有连接 */
  disconnect(): void {
    for (const node of this.nodes) {
      node.disconnect();
    }
    this.nodes.length = 0;
    if (this.sourceNode) {
      this.sourceNode.disconnect();
    }
  }

  /** 销毁 */
  destroy(): void {
    this.disconnect();
    this.sourceNode = null;
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  private rebuild(): void {
    // 重建在下次 applyTo 时进行
  }

  private createEffectNode(config: AudioEffectConfig): AudioNode | null {
    if (!this.audioContext) return null;

    switch (config.type) {
      case 'lowpass': {
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = config.frequency ?? 1000;
        filter.Q.value = config.Q ?? 1;
        return filter;
      }
      case 'highpass': {
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = config.frequency ?? 1000;
        filter.Q.value = config.Q ?? 1;
        return filter;
      }
      case 'bandpass': {
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = config.frequency ?? 1000;
        filter.Q.value = config.Q ?? 1;
        return filter;
      }
      case 'pitch': {
        // Web Audio API 不直接支持变调，使用 playbackRate
        // 这里返回 null，实际使用时需要在外部设置 audioElement.playbackRate
        return null;
      }
      case 'echo': {
        const delay = this.audioContext.createDelay(5);
        delay.delayTime.value = config.delayTime ?? 0.5;
        const feedback = this.audioContext.createGain();
        feedback.gain.value = config.decay ?? 0.5;
        const wetGain = this.audioContext.createGain();
        wetGain.gain.value = config.wetDry ?? 0.5;
        const dryGain = this.audioContext.createGain();
        dryGain.gain.value = 1 - (config.wetDry ?? 0.5);

        // 延迟反馈环
        delay.connect(feedback);
        feedback.connect(delay);
        delay.connect(wetGain);

        // 创建输入节点
        const input = this.audioContext.createGain();
        input.connect(dryGain);
        input.connect(delay);

        // 合并输出
        const merger = this.audioContext.createGain();
        dryGain.connect(merger);
        wetGain.connect(merger);

        return merger;
      }
      case 'compressor': {
        const compressor = this.audioContext.createDynamicsCompressor();
        compressor.threshold.value = config.threshold ?? -24;
        compressor.ratio.value = config.ratio ?? 4;
        compressor.attack.value = config.attack ?? 0.003;
        compressor.release.value = config.release ?? 0.25;
        return compressor;
      }
      default:
        return null;
    }
  }
}

// ========== 预设效果链 ==========

/** 清晰语音预设 */
export function createVoicePreset(): AudioEffectChain {
  const chain = new AudioEffectChain();
  chain.addEffect({ type: 'highpass', frequency: 200, Q: 0.7 });
  chain.addEffect({ type: 'lowpass', frequency: 3000, Q: 0.7 });
  chain.addEffect({ type: 'compressor', threshold: -20, ratio: 3 });
  return chain;
}

/** 水下/闷音预设 */
export function createUnderwaterPreset(): AudioEffectChain {
  const chain = new AudioEffectChain();
  chain.addEffect({ type: 'lowpass', frequency: 400, Q: 2 });
  chain.addEffect({ type: 'echo', delayTime: 0.1, decay: 0.3, wetDry: 0.2 });
  return chain;
}

/** 电话/对讲机预设 */
export function createTelephonePreset(): AudioEffectChain {
  const chain = new AudioEffectChain();
  chain.addEffect({ type: 'highpass', frequency: 400, Q: 1 });
  chain.addEffect({ type: 'lowpass', frequency: 3500, Q: 1 });
  return chain;
}
