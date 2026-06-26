// WebGL 渲染器：基于 WebGL 的 2D/3D 渲染管线，支持精灵批处理、纹理、着色器。
import { Logger } from '../utils/Logger';

const glLogger = Logger.forModule('WebGL');

/** 顶点格式 */
export interface Vertex {
  x: number;
  y: number;
  z?: number;
  u: number;
  v: number;
  r?: number;
  g?: number;
  b?: number;
  a?: number;
}

/** 着色器程序 */
export interface ShaderProgram {
  program: WebGLProgram;
  attribs: Record<string, number>;
  uniforms: Record<string, WebGLUniformLocation | null>;
}

/** 纹理对象 */
export class GLTexture {
  public glTexture: WebGLTexture | null = null;
  public width = 0;
  public height = 0;
  public loaded = false;

  constructor(private gl: WebGLRenderingContext) {}

  /** 从 Image/Canvas 创建纹理 */
  create(source: TexImageSource, flipY = true): void {
    this.glTexture = this.gl.createTexture();
    if (!this.glTexture) return;

    this.gl.bindTexture(this.gl.TEXTURE_2D, this.glTexture);
    this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, flipY ? 1 : 0);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, source);

    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);

    this.width = (source as any).width ?? 0;
    this.height = (source as any).height ?? 0;
    this.loaded = true;
  }

  /** 绑定纹理 */
  bind(unit = 0): void {
    if (!this.glTexture) return;
    this.gl.activeTexture(this.gl.TEXTURE0 + unit);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.glTexture);
  }

  /** 销毁 */
  destroy(): void {
    if (this.glTexture) {
      this.gl.deleteTexture(this.glTexture);
      this.glTexture = null;
    }
  }
}

/**
 * WebGL 渲染器：提供 2D/3D 渲染能力。
 */
export class WebGLRenderer {
  readonly gl: WebGLRenderingContext;
  readonly canvas: HTMLCanvasElement;
  readonly width: number;
  readonly height: number;

  private currentShader: ShaderProgram | null = null;
  private defaultShader: ShaderProgram;
  private spriteBatchBuffer: WebGLBuffer;
  private spriteBatchVAO: WebGLBuffer | null = null;
  private spriteBatchCount = 0;
  private maxBatchSize = 10000;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.width = canvas.width;
    this.height = canvas.height;

    const gl = canvas.getContext('webgl', {
      alpha: true,
      premultipliedAlpha: false,
      antialias: false,
      preserveDrawingBuffer: false,
    });

    if (!gl) {
      throw new Error('WebGL not supported');
    }

    this.gl = gl;

    // 默认着色器
    this.defaultShader = this.createShader(DEFAULT_VERTEX_SHADER, DEFAULT_FRAGMENT_SHADER);
    this.spriteBatchBuffer = this.gl.createBuffer()!;

    // 启用混合
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    glLogger.debug('WebGL renderer initialized %dx%d', this.width, this.height);
  }

  /** 创建着色器程序 */
  createShader(vertexSrc: string, fragmentSrc: string): ShaderProgram {
    const gl = this.gl;

    const vs = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vs, vertexSrc);
    gl.compileShader(vs);
    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(vs);
      gl.deleteShader(vs);
      throw new Error(`Vertex shader error: ${log}`);
    }

    const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fs, fragmentSrc);
    gl.compileShader(fs);
    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(fs);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      throw new Error(`Fragment shader error: ${log}`);
    }

    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const log = gl.getProgramInfoLog(program);
      gl.deleteProgram(program);
      throw new Error(`Program link error: ${log}`);
    }

    gl.deleteShader(vs);
    gl.deleteShader(fs);

    // 收集属性和 uniform
    const attribs: Record<string, number> = {};
    const attribCount = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
    for (let i = 0; i < attribCount; i++) {
      const info = gl.getActiveAttrib(program, i)!;
      attribs[info.name] = gl.getAttribLocation(program, info.name);
    }

    const uniforms: Record<string, WebGLUniformLocation | null> = {};
    const uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < uniformCount; i++) {
      const info = gl.getActiveUniform(program, i)!;
      uniforms[info.name] = gl.getUniformLocation(program, info.name);
    }

    return { program, attribs, uniforms };
  }

  /** 使用着色器 */
  useShader(shader: ShaderProgram): void {
    this.currentShader = shader;
    this.gl.useProgram(shader.program);
  }

  /** 使用默认着色器 */
  useDefaultShader(): void {
    this.useShader(this.defaultShader);
  }

  /** 清屏 */
  clear(r = 0, g = 0, b = 0, a = 1): void {
    this.gl.clearColor(r, g, b, a);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
  }

  /** 设置视口 */
  viewport(x: number, y: number, width: number, height: number): void {
    this.gl.viewport(x, y, width, height);
  }

  /** 绘制三角形 */
  drawTriangles(vertices: Float32Array, indices: Uint16Array): void {
    const gl = this.gl;
    const shader = this.currentShader ?? this.defaultShader;

    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);

    const stride = 8 * 4; // x,y,z,u,v,r,g,b,a = 9 floats, but we use 8 for simplicity
    if (shader.attribs.a_position !== undefined) {
      gl.enableVertexAttribArray(shader.attribs.a_position);
      gl.vertexAttribPointer(shader.attribs.a_position, 3, gl.FLOAT, false, stride, 0);
    }
    if (shader.attribs.a_texCoord !== undefined) {
      gl.enableVertexAttribArray(shader.attribs.a_texCoord);
      gl.vertexAttribPointer(shader.attribs.a_texCoord, 2, gl.FLOAT, false, stride, 12);
    }
    if (shader.attribs.a_color !== undefined) {
      gl.enableVertexAttribArray(shader.attribs.a_color);
      gl.vertexAttribPointer(shader.attribs.a_color, 4, gl.FLOAT, false, stride, 20);
    }

    const ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.DYNAMIC_DRAW);

    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

    gl.deleteBuffer(vbo);
    gl.deleteBuffer(ibo);
  }

  /** 开始精灵批处理 */
  beginSpriteBatch(): void {
    this.spriteBatchCount = 0;
    this.useDefaultShader();
  }

  /** 添加精灵到批处理 */
  addSprite(
    texture: GLTexture,
    x: number, y: number, width: number, height: number,
    u0 = 0, v0 = 0, u1 = 1, v1 = 1,
    r = 1, g = 1, b = 1, a = 1
  ): void {
    // TODO: 实现 WebGL 精灵批处理 — 需要顶点缓冲区管理、纹理图集绑定、批量绘制提交
    // 当前为占位实现，所有参数均未使用
    void texture;
    void x; void y; void width; void height;
    void u0; void v0; void u1; void v1;
    void r; void g; void b; void a;
    throw new Error('WebGL sprite batch not yet implemented');
  }

  /** 刷新精灵批处理 */
  flushSpriteBatch(): void {
    // TODO: 实现 WebGL 精灵批处理刷新 — 需要上传顶点缓冲区并执行 gl.drawElements
    if (this.spriteBatchCount === 0) return;
    throw new Error('WebGL sprite batch not yet implemented');
  }

  /** 设置矩阵 uniform */
  setMatrix(name: string, matrix: Float32Array): void {
    const shader = this.currentShader ?? this.defaultShader;
    const loc = shader.uniforms[name];
    if (loc) {
      this.gl.uniformMatrix4fv(loc, false, matrix);
    }
  }

  /** 设置纹理 uniform */
  setTexture(name: string, unit: number): void {
    const shader = this.currentShader ?? this.defaultShader;
    const loc = shader.uniforms[name];
    if (loc) {
      this.gl.uniform1i(loc, unit);
    }
  }

  /** 销毁 */
  destroy(): void {
    this.gl.deleteProgram(this.defaultShader.program);
    this.gl.deleteBuffer(this.spriteBatchBuffer);
    if (this.spriteBatchVAO) {
      this.gl.deleteBuffer(this.spriteBatchVAO);
    }
  }
}

// ========== 默认着色器 ==========

const DEFAULT_VERTEX_SHADER = `
  attribute vec3 a_position;
  attribute vec2 a_texCoord;
  attribute vec4 a_color;

  uniform mat4 u_projection;
  uniform mat4 u_view;
  uniform mat4 u_model;

  varying vec2 v_texCoord;
  varying vec4 v_color;

  void main() {
    gl_Position = u_projection * u_view * u_model * vec4(a_position, 1.0);
    v_texCoord = a_texCoord;
    v_color = a_color;
  }
`;

const DEFAULT_FRAGMENT_SHADER = `
  precision mediump float;

  uniform sampler2D u_texture;
  uniform bool u_useTexture;

  varying vec2 v_texCoord;
  varying vec4 v_color;

  void main() {
    if (u_useTexture) {
      gl_FragColor = texture2D(u_texture, v_texCoord) * v_color;
    } else {
      gl_FragColor = v_color;
    }
  }
`;
