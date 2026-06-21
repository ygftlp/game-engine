# Lite Game Engine 商用部署指南

**版本**: 1.0.0  
**更新日期**: 2026年6月13日

---

## 一、部署前准备

### 1.1 环境要求

| 工具 | 版本 | 用途 |
|------|------|------|
| **Node.js** | 16.0+ | 构建环境 |
| **npm** | 8.0+ | 包管理 |
| **TypeScript** | 5.4.0+ | 类型检查 |
| **Git** | 2.30+ | 版本控制 |

### 1.2 开发工具

| 平台 | 工具 | 下载地址 |
|------|------|----------|
| **微信** | 微信开发者工具 | https://developers.weixin.qq.com/miniprogram/dev/devtools/ |
| **抖音** | 抖音开发者工具 | https://developer.open-douyin.com/docs/resource/zh-CN/mini-app/develop/developer-instrument/ |
| **H5** | VS Code + Live Server | https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer |

### 1.3 账号准备

| 平台 | 需要 | 说明 |
|------|------|------|
| **微信** | AppID | 小游戏专用AppID |
| **抖音** | AppID | 小游戏专用AppID |
| **H5** | 域名 | 已备案域名 + HTTPS |

---

## 二、微信小游戏部署

### 2.1 构建微信版本

```bash
# 克隆项目
git clone https://github.com/lite-engine/lite-game-engine.git
cd lite-game-engine

# 安装依赖
npm install

# 构建微信版本
npm run build

# 输出目录
# dist/wechat/game.js
```

### 2.2 微信开发者工具配置

**步骤1：导入项目**

1. 打开微信开发者工具
2. 选择「小游戏」项目类型
3. 填入你的 AppID（测试可用 `touristappid`）
4. 项目目录选择 `dist/wechat/`

**步骤2：配置 game.json**

```json
{
  "deviceOrientation": "portrait",
  "showStatusBar": false,
  "networkTimeout": {
    "request": 10000,
    "downloadFile": 10000
  },
  "subpackages": []
}
```

**步骤3：配置 project.config.json**

```json
{
  "appid": "your-appid-here",
  "projectname": "your-game-name",
  "setting": {
    "es6": false,
    "minified": true,
    "postcss": false
  },
  "compileType": "game",
  "libVersion": "latest"
}
```

### 2.4 微信审核要点

| 审核项 | 要求 | 处理方式 |
|--------|------|----------|
| **隐私政策** | 必须提供 | 在设置页面添加 |
| **用户协议** | 必须提供 | 在设置页面添加 |
| **版号** | 商用需要 | 联系出版部门 |
| **实名认证** | 必须集成 | 接入微信实名API |
| **防沉迷** | 必须集成 | 接入微信防沉迷API |

### 2.5 微信发布流程

```
本地测试 → 体验版测试 → 提交审核 → 审核通过 → 发布上线
    ↓           ↓           ↓           ↓
  开发者      指定用户     微信团队     全量发布
```

---

## 三、抖音小游戏部署

### 3.1 构建抖音版本

```bash
# 构建抖音版本
npm run build

# 输出目录
# dist/douyin/game.js
```

### 3.2 抖音开发者工具配置

**步骤1：导入项目**

1. 打开抖音开发者工具
2. 新建小游戏项目
3. 填入你的 AppID
4. 项目目录选择 `dist/douyin/`

**步骤2：配置 game.json**

```json
{
  "deviceOrientation": "portrait",
  "showStatusBar": false,
  "networkTimeout": {
    "request": 10000,
    "downloadFile": 10000
  }
}
```

### 3.3 抖音审核要点

| 审核项 | 要求 | 处理方式 |
|--------|------|----------|
| **隐私政策** | 必须提供 | 在设置页面添加 |
| **用户协议** | 必须提供 | 在设置页面添加 |
| **内容合规** | 必须符合 | 遵守抖音内容规范 |
| **实名认证** | 必须集成 | 接入抖音实名API |

### 3.4 抖音发布流程

```
本地测试 → 提交审核 → 审核通过 → 发布上线
    ↓           ↓           ↓
  开发者     抖音团队     全量发布
```

---

## 四、H5网页部署

### 4.1 构建H5版本

```bash
# 构建H5版本
npm run build

# 输出目录
# dist/h5/
# ├── index.html
# └── game.h5.js
```

### 4.2 服务器配置

**Nginx配置示例**

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    root /path/to/dist/h5;
    index index.html;
    
    # 启用gzip压缩
    gzip on;
    gzip_types text/plain application/javascript text/css;
    
    # 缓存策略
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # 禁止缓存HTML
    location = /index.html {
        expires -1;
        add_header Cache-Control "no-store, no-cache, must-revalidate";
    }
}
```

**Apache配置示例**

```apache
<VirtualHost *:443>
    ServerName your-domain.com
    DocumentRoot /path/to/dist/h5
    
    SSLEngine on
    SSLCertificateFile /path/to/cert.pem
    SSLCertificateKeyFile /path/to/key.pem
    
    # 启用gzip压缩
    AddOutputFilterByType DEFLATE text/html text/plain application/javascript
    
    # 缓存策略
    <FilesMatch "\.(js|css|png|jpg)$">
        Header set Cache-Control "max-age=31536000, public"
    </FilesMatch>
</VirtualHost>
```

### 4.3 CDN配置

| 配置项 | 推荐值 | 说明 |
|--------|--------|------|
| **缓存时间** | 1年 | 静态资源长期缓存 |
| **回源协议** | HTTPS | 强制HTTPS |
| **HTTP/2** | 启用 | 提升加载性能 |
| **Brotli** | 启用 | 更好的压缩率 |

### 4.4 微信内置浏览器适配

```html
<!-- 添加微信JSSDK（如需要） -->
<script src="https://res.wx.qq.com/open/js/jweixin-1.6.0.js"></script>

<!-- 禁用微信字体调整 -->
<script>
  if (typeof WeixinJSBridge == "object" && typeof WeixinJSBridge.invoke == "function") {
    handleFontSize();
  } else {
    if (document.addEventListener) {
      document.addEventListener("WeixinJSBridgeReady", handleFontSize, false);
    } else if (document.attachEvent) {
      document.attachEvent("WeixinJSBridgeReady", handleFontSize);
      document.attachEvent("onWeixinJSBridgeReady", handleFontSize);
    }
  }
  function handleFontSize() {
    WeixinJSBridge.invoke('setFontSizeCallback', { 'fontSize' : 0 });
    WeixinJSBridge.on('menu:setfont', function() {
      WeixinJSBridge.invoke('setFontSizeCallback', { 'fontSize' : 0 });
    });
  }
</script>
```

---

## 五、热更新实施方案

### 5.1 微信小游戏热更新

微信小游戏支持分包加载，可实现资源热更新：

```typescript
// 分包配置 game.json
{
  "subpackages": [
    {
      "name": "level1",
      "root": "levels/level1/"
    },
    {
      "name": "level2", 
      "root": "levels/level2/"
    }
  ]
}

// 动态加载分包
wx.loadSubpackage({
  name: 'level1',
  success: () => {
    console.log('分包加载成功');
  },
  fail: (err) => {
    console.error('分包加载失败', err);
  }
});
```

### 5.2 H5热更新

```typescript
// 版本号管理
const VERSION = '1.0.0';
const ASSET_VERSION = '20260613';

// 资源URL添加版本号
function getVersionedUrl(url: string): string {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${ASSET_VERSION}`;
}

// 使用
const texture = await loader.loadTexture(
  getVersionedUrl('assets/sprite.png')
);
```

### 5.3 代码热更新（谨慎使用）

```typescript
// 动态加载脚本（仅H5支持）
async function loadScript(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${url}`));
    document.head.appendChild(script);
  });
}

// 使用
await loadScript('https://cdn.example.com/patch.js');
```

---

## 六、性能优化指南

### 6.1 代码优化

```typescript
// 1. 使用对象池减少GC
const bulletPool = new Pool(
  () => new Bullet(),
  (bullet) => bullet.reset(),
  100  // 最大数量
);

// 2. 避免每帧创建对象
// ❌ 错误示例
update(dt: number) {
  const pos = new Vec2(this.x, this.y); // 每帧创建新对象
}

// ✅ 正确示例
private tempVec = new Vec2();
update(dt: number) {
  this.tempVec.set(this.x, this.y); // 复用对象
}

// 3. 使用脏标记减少计算
private _dirty = true;
private _worldMatrix = new Matrix2D();

get worldMatrix(): Matrix2D {
  if (this._dirty) {
    this._worldMatrix.identity();
    this._worldMatrix.applyTransform(this.x, this.y, this.rotation, this.scaleX, this.scaleY);
    this._dirty = false;
  }
  return this._worldMatrix;
}

set x(value: number) {
  this._x = value;
  this._dirty = true;
}
```

### 6.2 渲染优化

```typescript
// 1. 合并绘制调用
// ❌ 错误示例
for (const sprite of sprites) {
  ctx.drawImage(sprite.texture, sprite.x, sprite.y);
}

// ✅ 正确示例（使用图集）
const atlas = await loader.loadTexture('atlas.png');
for (const sprite of sprites) {
  ctx.drawImage(
    atlas.image,
    sprite.frame.x, sprite.frame.y,
    sprite.frame.width, sprite.frame.height,
    sprite.x, sprite.y,
    sprite.width, sprite.height
  );
}

// 2. 裁剪不可见区域
if (node.x + node.width < 0 || node.x > canvasWidth) return;
if (node.y + node.height < 0 || node.y > canvasHeight) return;
```

### 6.3 内存优化

```typescript
// 1. 及时释放资源
scene.onExit() {
  loader.unloadTexture('level-bg.png');
  loader.unloadAllAudio();
}

// 2. 使用适当的纹理格式
// 小图标使用 PNG-8
// 大背景使用 JPG (quality=0.8)
// 需要透明通道使用 PNG-24

// 3. 纹理尺寸使用2的幂次方
// ✅ 256x256, 512x512, 1024x1024
// ❌ 300x200, 500x400
```

---

## 七、运维监控方案

### 7.1 性能监控

```typescript
// FPS监控
class FPSMonitor {
  private frames = 0;
  private lastTime = 0;
  private fps = 0;
  
  update(time: number) {
    this.frames++;
    if (time - this.lastTime >= 1000) {
      this.fps = this.frames;
      this.frames = 0;
      this.lastTime = time;
      this.report();
    }
  }
  
  private report() {
    // 上报FPS数据
    if (this.fps < 30) {
      console.warn(`Low FPS: ${this.fps}`);
      // 上报到监控平台
    }
  }
}
```

### 7.2 错误监控

```typescript
// 全局错误捕获
window.onerror = (message, source, lineno, colno, error) => {
  reportError({
    type: 'js_error',
    message,
    source,
    lineno,
    colno,
    stack: error?.stack
  });
};

// Promise错误捕获
window.addEventListener('unhandledrejection', (event) => {
  reportError({
    type: 'promise_error',
    message: event.reason?.message || 'Unhandled Promise Rejection',
    stack: event.reason?.stack
  });
});
```

### 7.3 数据上报

```typescript
// 性能数据上报
interface PerformanceData {
  fps: number;
  memory: number;
  loadTime: number;
  renderTime: number;
}

function reportPerformance(data: PerformanceData) {
  // 使用navigator.sendBeacon确保页面关闭也能上报
  navigator.sendBeacon('/api/performance', JSON.stringify(data));
}
```

---

## 八、定制化开发接口

### 8.1 自定义组件

```typescript
// 创建自定义UI组件
class CustomButton extends UIWidget {
  constructor(text: string, width: number, height: number) {
    super();
    this.width = width;
    this.height = height;
    this.text = text;
  }
  
  protected draw(renderer: Renderer): void {
    // 自定义绘制逻辑
  }
  
  protected onClick(): void {
    // 自定义点击逻辑
  }
}
```

### 8.2 自定义平台适配器

```typescript
// 实现自定义平台
class CustomPlatform implements IPlatform {
  readonly name = 'custom';
  
  createCanvas(): ICanvas {
    // 自定义Canvas创建
  }
  
  createImage(): IImage {
    // 自定义Image创建
  }
  
  createAudio(): IAudio {
    // 自定义Audio创建
  }
  
  getScreenInfo(): ScreenInfo {
    // 返回屏幕信息
  }
  
  onPointerStart(handler: PointerHandler): void {
    // 绑定触摸事件
  }
  
  onPointerMove(handler: PointerHandler): void {
    // 绑定移动事件
  }
  
  onPointerEnd(handler: PointerHandler): void {
    // 绑定结束事件
  }
  
  requestJSON(url: string): Promise<unknown> {
    // 自定义网络请求
  }
  
  requestAnimationFrame(cb: (time: number) => void): number {
    // 自定义动画帧
  }
}
```

### 8.3 插件系统

```typescript
// 引擎插件接口
interface EnginePlugin {
  name: string;
  version: string;
  install(engine: Engine): void;
  uninstall(): void;
}

// 使用插件
class AnalyticsPlugin implements EnginePlugin {
  name = 'analytics';
  version = '1.0.0';
  
  install(engine: Engine) {
    // 注入分析功能
    engine.sceneManager.on('sceneChange', (scene) => {
      this.trackSceneView(scene);
    });
  }
  
  uninstall() {
    // 清理资源
  }
}
```

---

## 九、售后技术支持流程

### 9.1 技术支持渠道

| 渠道 | 响应时间 | 适用场景 |
|------|----------|----------|
| **社区论坛** | 24-48h | 一般问题 |
| **邮件支持** | 24h | 技术问题 |
| **在线客服** | 2h | 紧急问题 |
| **电话支持** | 即时 | 严重故障 |

### 9.2 问题反馈模板

```markdown
## 问题描述
[简要描述问题现象]

## 复现步骤
1. [步骤1]
2. [步骤2]
3. [步骤3]

## 预期行为
[描述预期的正确行为]

## 实际行为
[描述实际的错误行为]

## 环境信息
- 引擎版本: [版本号]
- 平台: [微信/抖音/H5]
- 设备: [设备型号]
- 系统版本: [操作系统版本]

## 错误日志
[粘贴控制台错误信息]

## 截图/视频
[如有，附上截图或视频]
```

### 9.3 问题升级流程

```
一般问题 → 社区论坛/邮件
    ↓ (24h未解决)
紧急问题 → 在线客服
    ↓ (2h未解决)
严重故障 → 电话支持
    ↓ (需要开发介入)
技术专家 → 远程协助
```

---

## 十、常见问题解答 (FAQ)

### Q1: 如何获取AppID？

**微信小游戏：**
1. 访问 https://mp.weixin.qq.com/
2. 注册小程序账号
3. 在「开发」-「开发设置」中获取AppID

**抖音小游戏：**
1. 访问 https://developer.open-douyin.com/
2. 注册开发者账号
3. 创建小游戏应用获取AppID

### Q2: 构建失败怎么办？

```bash
# 清除缓存重新构建
rm -rf node_modules
npm install
npm run build

# 检查TypeScript错误
npm run typecheck
```

### Q3: 如何调试性能问题？

1. 使用微信开发者工具的「性能面板」
2. 使用Chrome DevTools的Performance面板
3. 查看控制台的FPS输出

### Q4: 如何适配不同屏幕尺寸？

```typescript
// 使用相对坐标
const centerX = engine.width / 2;
const centerY = engine.height / 2;

// 使用百分比布局
node.x = engine.width * 0.1;  // 距离左边10%
node.y = engine.height * 0.9; // 距离底部10%
```

---

**文档版本历史**

| 版本 | 日期 | 修改内容 |
|------|------|----------|
| 1.0.0 | 2026-06-13 | 初始版本发布 |