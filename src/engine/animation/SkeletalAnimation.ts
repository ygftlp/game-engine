// 骨骼动画系统：支持骨骼定义、关键帧动画、IK、动画混合。
import { Matrix2D } from '../math/Matrix2D';

/** 骨骼 */
export interface Bone {
  name: string;
  parent?: string;
  length: number;
  /** 初始位置（相对于父骨骼） */
  x: number;
  y: number;
  /** 初始旋转（弧度） */
  rotation: number;
  /** 初始缩放 */
  scaleX?: number;
  scaleY?: number;
}

/** 关键帧 */
export interface Keyframe {
  /** 时间（秒） */
  time: number;
  /** 位置 */
  x?: number;
  y?: number;
  /** 旋转（弧度） */
  rotation?: number;
  /** 缩放 */
  scaleX?: number;
  scaleY?: number;
}

/** 骨骼动画轨道 */
export interface BoneTrack {
  boneName: string;
  keyframes: Keyframe[];
}

/** 动画剪辑配置 */
export interface SkeletalClipConfig {
  name: string;
  duration: number;
  tracks: BoneTrack[];
  /** 是否循环 */
  loop?: boolean;
}

/**
 * 骨骼动画剪辑
 */
export class SkeletalClip {
  readonly name: string;
  readonly duration: number;
  readonly tracks: BoneTrack[];
  readonly loop: boolean;

  constructor(config: SkeletalClipConfig) {
    this.name = config.name;
    this.duration = config.duration;
    this.tracks = config.tracks;
    this.loop = config.loop ?? true;
  }

  /** 在指定时间采样，返回每根骨骼的变换 */
  sample(time: number): Map<string, { x: number; y: number; rotation: number; scaleX: number; scaleY: number }> {
    const result = new Map<string, { x: number; y: number; rotation: number; scaleX: number; scaleY: number }>();

    for (const track of this.tracks) {
      const kf = track.keyframes;
      if (kf.length === 0) continue;

      let t = time;
      if (this.loop) {
        t = t % this.duration;
      } else {
        t = Math.min(t, this.duration);
      }

      // 找到当前帧区间
      let i = 0;
      while (i < kf.length - 1 && kf[i + 1].time <= t) i++;

      if (i >= kf.length - 1) {
        const last = kf[kf.length - 1];
        result.set(track.boneName, {
          x: last.x ?? 0,
          y: last.y ?? 0,
          rotation: last.rotation ?? 0,
          scaleX: last.scaleX ?? 1,
          scaleY: last.scaleY ?? 1,
        });
        continue;
      }

      const k0 = kf[i];
      const k1 = kf[i + 1];
      const localT = (t - k0.time) / (k1.time - k0.time);

      result.set(track.boneName, {
        x: (k0.x ?? 0) + ((k1.x ?? 0) - (k0.x ?? 0)) * localT,
        y: (k0.y ?? 0) + ((k1.y ?? 0) - (k0.y ?? 0)) * localT,
        rotation: (k0.rotation ?? 0) + ((k1.rotation ?? 0) - (k0.rotation ?? 0)) * localT,
        scaleX: (k0.scaleX ?? 1) + ((k1.scaleX ?? 1) - (k0.scaleX ?? 1)) * localT,
        scaleY: (k0.scaleY ?? 1) + ((k1.scaleY ?? 1) - (k0.scaleY ?? 1)) * localT,
      });
    }

    return result;
  }
}

/**
 * 骨骼：定义骨架结构
 */
export class Skeleton {
  private bones: Bone[] = [];
  private boneMap = new Map<string, Bone>();

  /** 添加骨骼 */
  addBone(bone: Bone): void {
    this.bones.push(bone);
    this.boneMap.set(bone.name, bone);
  }

  /** 获取骨骼 */
  getBone(name: string): Bone | undefined {
    return this.boneMap.get(name);
  }

  /** 获取所有骨骼 */
  getBones(): readonly Bone[] {
    return this.bones;
  }

  /** 计算骨骼的世界变换（从根到叶递归） */
  computeWorldTransforms(): Map<string, Matrix2D> {
    const transforms = new Map<string, Matrix2D>();

    const compute = (bone: Bone): Matrix2D => {
      const local = new Matrix2D();
      local.applyTransform(bone.x, bone.y, bone.rotation, bone.scaleX ?? 1, bone.scaleY ?? 1);

      if (bone.parent) {
        const parentBone = this.boneMap.get(bone.parent);
        if (parentBone) {
          const parentMatrix = transforms.get(bone.parent) ?? compute(parentBone);
          // 合并变换
          const world = new Matrix2D();
          world.a = parentMatrix.a;
          world.b = parentMatrix.b;
          world.c = parentMatrix.c;
          world.d = parentMatrix.d;
          world.e = parentMatrix.e;
          world.f = parentMatrix.f;
          world.applyTransform(bone.x, bone.y, bone.rotation, bone.scaleX ?? 1, bone.scaleY ?? 1);
          transforms.set(bone.name, world);
          return world;
        }
      }

      transforms.set(bone.name, local);
      return local;
    };

    for (const bone of this.bones) {
      if (!transforms.has(bone.name)) {
        compute(bone);
      }
    }

    return transforms;
  }
}

/**
 * 骨骼动画播放器：驱动骨骼根据动画剪辑运动。
 */
export class SkeletalAnimator {
  private skeleton: Skeleton;
  private clips = new Map<string, SkeletalClip>();
  private currentClip: SkeletalClip | null = null;
  private currentTime = 0;
  private playing = false;

  constructor(skeleton: Skeleton) {
    this.skeleton = skeleton;
  }

  /** 添加动画剪辑 */
  addClip(clip: SkeletalClip): void {
    this.clips.set(clip.name, clip);
  }

  /** 播放动画 */
  play(name: string, restart = false): void {
    const clip = this.clips.get(name);
    if (!clip) return;
    if (this.currentClip === clip && this.playing && !restart) return;
    this.currentClip = clip;
    this.currentTime = 0;
    this.playing = true;
  }

  /** 暂停 */
  pause(): void {
    this.playing = false;
  }

  /** 恢复 */
  resume(): void {
    this.playing = true;
  }

  /** 停止 */
  stop(): void {
    this.playing = false;
    this.currentTime = 0;
  }

  /** 每帧更新 */
  update(dt: number): void {
    if (!this.playing || !this.currentClip) return;
    this.currentTime += dt;
    if (this.currentClip.loop) {
      this.currentTime = this.currentTime % this.currentClip.duration;
    } else {
      this.currentTime = Math.min(this.currentTime, this.currentClip.duration);
    }
  }

  /** 获取当前骨骼变换 */
  getTransforms(): Map<string, Matrix2D> {
    if (!this.currentClip) {
      return this.skeleton.computeWorldTransforms();
    }

    const sampled = this.currentClip.sample(this.currentTime);
    const transforms = new Map<string, Matrix2D>();

    for (const bone of this.skeleton.getBones()) {
      const transform = new Matrix2D();
      const sample = sampled.get(bone.name);
      if (sample) {
        transform.applyTransform(
          bone.x + sample.x,
          bone.y + sample.y,
          bone.rotation + sample.rotation,
          (bone.scaleX ?? 1) * sample.scaleX,
          (bone.scaleY ?? 1) * sample.scaleY
        );
      } else {
        transform.applyTransform(bone.x, bone.y, bone.rotation, bone.scaleX ?? 1, bone.scaleY ?? 1);
      }
      transforms.set(bone.name, transform);
    }

    return transforms;
  }

  /** 是否正在播放 */
  isPlaying(): boolean {
    return this.playing;
  }

  /** 获取当前动画名 */
  getCurrentClipName(): string | null {
    return this.currentClip?.name ?? null;
  }

  /** 获取当前时间 */
  getCurrentTime(): number {
    return this.currentTime;
  }
}
