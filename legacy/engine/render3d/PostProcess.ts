// 后处理效果：支持模糊、泛光、色彩校正、FXAA、HDR 色调映射。

/** 后处理效果类型 */
export type PostProcessType = 'blur' | 'bloom' | 'colorGrading' | 'fxaa' | 'toneMapping' | 'vignette' | 'chromaticAberration';

/** 后处理配置 */
export interface PostProcessConfig {
  type: PostProcessType;
  enabled?: boolean;
  /** 模糊：模糊半径 */
  blurRadius?: number;
  /** 泛光：阈值 */
  bloomThreshold?: number;
  /** 泛光：强度 */
  bloomIntensity?: number;
  /** 泛光：模糊半径 */
  bloomRadius?: number;
  /** 色彩校正：亮度 -1~1 */
  brightness?: number;
  /** 色彩校正：对比度 0~2 */
  contrast?: number;
  /** 色彩校正：饱和度 0~2 */
  saturation?: number;
  /** 色彩校正：色调旋转 0~360 */
  hueShift?: number;
  /** 暗角：强度 0~1 */
  vignetteIntensity?: number;
  /** 色差：强度 0~10 */
  chromaticAberration?: number;
  /** 色调映射：模式 */
  toneMapMode?: 'reinhard' | 'aces' | 'linear';
}

/**
 * 后处理效果
 */
export class PostProcess {
  type: PostProcessType;
  enabled: boolean;
  config: PostProcessConfig;

  constructor(config: PostProcessConfig) {
    this.type = config.type;
    this.enabled = config.enabled ?? true;
    this.config = config;
  }

  /** 更新参数 */
  update(config: Partial<PostProcessConfig>): void {
    Object.assign(this.config, config);
  }
}

/**
 * 后处理管线：管理后处理效果链。
 */
export class PostProcessPipeline {
  private effects: PostProcess[] = [];

  /** 添加效果 */
  addEffect(config: PostProcessConfig): PostProcess {
    const effect = new PostProcess(config);
    this.effects.push(effect);
    return effect;
  }

  /** 移除效果 */
  removeEffect(effect: PostProcess): void {
    const idx = this.effects.indexOf(effect);
    if (idx >= 0) this.effects.splice(idx, 1);
  }

  /** 获取所有启用的效果 */
  getActiveEffects(): PostProcess[] {
    return this.effects.filter(e => e.enabled);
  }

  /** 清除所有效果 */
  clear(): void {
    this.effects.length = 0;
  }

  /** 获取效果数量 */
  get count(): number {
    return this.effects.length;
  }
}

// ========== 后处理 Shader 代码 ==========

/** 高斯模糊着色器 */
export const BLUR_FRAGMENT_SHADER = `
  precision mediump float;
  uniform sampler2D u_texture;
  uniform vec2 u_resolution;
  uniform float u_radius;
  varying vec2 v_texCoord;

  void main() {
    vec2 texelSize = 1.0 / u_resolution;
    vec4 result = vec4(0.0);

    float weights[5];
    weights[0] = 0.227027;
    weights[1] = 0.1945946;
    weights[2] = 0.1216216;
    weights[3] = 0.054054;
    weights[4] = 0.016216;

    result += texture2D(u_texture, v_texCoord) * weights[0];

    for (int i = 1; i < 5; i++) {
      float offset = float(i) * u_radius * texelSize.x;
      result += texture2D(u_texture, v_texCoord + vec2(offset, 0.0)) * weights[i];
      result += texture2D(u_texture, v_texCoord - vec2(offset, 0.0)) * weights[i];
    }

    gl_FragColor = result;
  }
`;

/** 泛光提取着色器 */
export const BLOOM_EXTRACT_SHADER = `
  precision mediump float;
  uniform sampler2D u_texture;
  uniform float u_threshold;
  varying vec2 v_texCoord;

  void main() {
    vec4 color = texture2D(u_texture, v_texCoord);
    float brightness = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));
    gl_FragColor = brightness > u_threshold ? color : vec4(0.0);
  }
`;

/** 色彩校正着色器 */
export const COLOR_GRADING_SHADER = `
  precision mediump float;
  uniform sampler2D u_texture;
  uniform float u_brightness;
  uniform float u_contrast;
  uniform float u_saturation;
  uniform float u_hueShift;
  varying vec2 v_texCoord;

  vec3 rgb2hsv(vec3 c) {
    vec4 K = vec4(0.0, -1.0/3.0, 2.0/3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
  }

  vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  }

  void main() {
    vec4 color = texture2D(u_texture, v_texCoord);
    vec3 hsv = rgb2hsv(color.rgb);
    hsv.x = fract(hsv.x + u_hueShift / 360.0);
    hsv.y *= u_saturation;
    vec3 rgb = hsv2rgb(hsv);
    rgb = (rgb - 0.5) * u_contrast + 0.5;
    rgb += u_brightness;
    gl_FragColor = vec4(rgb, color.a);
  }
`;

/** FXAA 着色器（简化版） */
export const FXAA_SHADER = `
  precision mediump float;
  uniform sampler2D u_texture;
  uniform vec2 u_resolution;
  varying vec2 v_texCoord;

  void main() {
    vec2 texelSize = 1.0 / u_resolution;
    vec3 rgbNW = texture2D(u_texture, v_texCoord + texelSize * vec2(-1, -1)).rgb;
    vec3 rgbNE = texture2D(u_texture, v_texCoord + texelSize * vec2(1, -1)).rgb;
    vec3 rgbSW = texture2D(u_texture, v_texCoord + texelSize * vec2(-1, 1)).rgb;
    vec3 rgbSE = texture2D(u_texture, v_texCoord + texelSize * vec2(1, 1)).rgb;
    vec3 rgbM = texture2D(u_texture, v_texCoord).rgb;

    vec3 luma = vec3(0.299, 0.587, 0.114);
    float lumaNW = dot(rgbNW, luma);
    float lumaNE = dot(rgbNE, luma);
    float lumaSW = dot(rgbSW, luma);
    float lumaSE = dot(rgbSE, luma);
    float lumaM = dot(rgbM, luma);

    float lumaMin = min(lumaM, min(min(lumaNW, lumaNE), min(lumaSW, lumaSE)));
    float lumaMax = max(lumaM, max(max(lumaNW, lumaNE), max(lumaSW, lumaSE)));

    vec2 dir;
    dir.x = -((lumaNW + lumaNE) - (lumaSW + lumaSE));
    dir.y = ((lumaNW + lumaSW) - (lumaNE + lumaSE));

    float dirReduce = max((lumaNW + lumaNE + lumaSW + lumaSE) * (0.25 * 0.0312), 0.0078125);
    float rcpDirMin = 1.0 / (min(abs(dir.x), abs(dir.y)) + dirReduce);
    dir = min(vec2(8.0), max(vec2(-8.0), dir * rcpDirMin)) * texelSize;

    vec3 rgbA = 0.5 * (texture2D(u_texture, v_texCoord + dir * (1.0/3.0 - 0.5)).rgb +
                        texture2D(u_texture, v_texCoord + dir * (2.0/3.0 - 0.5)).rgb);
    vec3 rgbB = rgbA * 0.5 + 0.25 * (texture2D(u_texture, v_texCoord + dir * -0.5).rgb +
                                       texture2D(u_texture, v_texCoord + dir * 0.5).rgb);

    float lumaB = dot(rgbB, luma);
    if (lumaB < lumaMin || lumaB > lumaMax) {
      gl_FragColor = vec4(rgbA, 1.0);
    } else {
      gl_FragColor = vec4(rgbB, 1.0);
    }
  }
`;

/** 色调映射着色器 */
export const TONE_MAP_SHADER = `
  precision mediump float;
  uniform sampler2D u_texture;
  uniform int u_mode; // 0=linear, 1=reinhard, 2=aces
  varying vec2 v_texCoord;

  vec3 reinhard(vec3 color) {
    return color / (color + vec3(1.0));
  }

  vec3 aces(vec3 color) {
    float a = 2.51;
    float b = 0.03;
    float c = 2.43;
    float d = 0.59;
    float e = 0.14;
    return clamp((color * (a * color + b)) / (color * (c * color + d) + e), 0.0, 1.0);
  }

  void main() {
    vec4 color = texture2D(u_texture, v_texCoord);
    vec3 mapped;

    if (u_mode == 1) {
      mapped = reinhard(color.rgb);
    } else if (u_mode == 2) {
      mapped = aces(color.rgb);
    } else {
      mapped = color.rgb;
    }

    gl_FragColor = vec4(mapped, color.a);
  }
`;

/** 暗角着色器 */
export const VIGNETTE_SHADER = `
  precision mediump float;
  uniform sampler2D u_texture;
  uniform float u_intensity;
  varying vec2 v_texCoord;

  void main() {
    vec4 color = texture2D(u_texture, v_texCoord);
    vec2 uv = v_texCoord * 2.0 - 1.0;
    float vignette = 1.0 - dot(uv, uv) * u_intensity;
    gl_FragColor = vec4(color.rgb * vignette, color.a);
  }
`;
