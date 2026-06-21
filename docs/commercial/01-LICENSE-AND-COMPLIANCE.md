# Lite Game Engine 商用授权与合规文档

**版本**: 1.0.0  
**生效日期**: 2026年6月13日  
**文档状态**: 正式发布

---

## 一、知识产权声明

### 1.1 版权归属

```
版权所有 © 2026 Lite Game Engine 团队
保留所有权利
```

本游戏引擎（以下简称"本引擎"）的所有源代码、文档、图标、示例代码及其他相关材料的知识产权归 Lite Game Engine 团队所有。

### 1.2 开源协议

本引擎采用 **MIT License** 开源协议发布：

```
MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### 1.3 商用权利说明

根据 MIT 协议，用户享有以下商用权利：

| 权利 | 说明 | 限制 |
|------|------|------|
| **使用** | 可用于商业项目开发 | 无限制 |
| **修改** | 可修改源代码 | 无限制 |
| **分发** | 可分发修改版本 | 需保留版权声明 |
| **私用** | 可用于私有项目 | 无限制 |
| **授权** | 可再授权给第三方 | 无限制 |
| **销售** | 可销售基于引擎开发的游戏 | 无限制 |

---

## 二、商用授权分级方案

### 2.1 授权级别

| 级别 | 名称 | 价格 | 适用场景 | 技术支持 |
|------|------|------|----------|----------|
| **Community** | 社区版 | 免费 | 个人开发者、学习研究 | 社区论坛 |
| **Indie** | 独立开发者版 | ¥999/年 | 独立游戏工作室 | 邮件支持（48h响应） |
| **Professional** | 专业版 | ¥4,999/年 | 中小型游戏公司 | 专属客服（24h响应） |
| **Enterprise** | 企业版 | 定制报价 | 大型游戏公司、发行商 | 7×24小时支持 |

### 2.2 授权内容对比

| 功能特性 | Community | Indie | Professional | Enterprise |
|----------|-----------|-------|--------------|------------|
| 核心引擎功能 | ✓ | ✓ | ✓ | ✓ |
| 全平台发布 | ✓ | ✓ | ✓ | ✓ |
| UI组件系统 | ✓ | ✓ | ✓ | ✓ |
| 示例代码 | ✓ | ✓ | ✓ | ✓ |
| 商用项目使用 | ✓ | ✓ | ✓ | ✓ |
| 源代码访问 | ✓ | ✓ | ✓ | ✓ |
| 去除品牌标识 | ✗ | ✓ | ✓ | ✓ |
| 优先Bug修复 | ✗ | ✗ | ✓ | ✓ |
| 定制化开发支持 | ✗ | ✗ | ✗ | ✓ |
| 私有部署支持 | ✗ | ✗ | ✗ | ✓ |
| SLA服务保障 | ✗ | ✗ | ✗ | ✓ |

### 2.3 授权获取流程

1. **注册账号**：访问官方网站注册开发者账号
2. **选择授权**：根据项目需求选择合适的授权级别
3. **完成支付**：支持支付宝、微信、银行转账等方式
4. **获取授权码**：支付成功后获取唯一授权码
5. **集成验证**：在项目中集成授权码完成验证

---

## 三、第三方开源组件合规清单

### 3.1 核心依赖

| 组件名称 | 版本 | 协议 | 商用限制 | 用途 |
|----------|------|------|----------|------|
| TypeScript | 5.4.0 | Apache-2.0 | 无限制 | 类型系统 |
| esbuild | 0.21.0 | MIT | 无限制 | 构建工具 |
| vitest | 1.6.0 | MIT | 无限制 | 测试框架 |

### 3.2 协议兼容性分析

```
MIT License 兼容性矩阵
├── Apache-2.0 ✓ (兼容)
├── BSD 2-Clause ✓ (兼容)
├── BSD 3-Clause ✓ (兼容)
├── ISC ✓ (兼容)
├── MIT ✓ (兼容)
├── MPL-2.0 ✓ (兼容，需注意修改文件声明)
├── LGPL-2.1 ✓ (兼容，动态链接)
├── GPL-2.0 ✗ (不兼容，禁止静态链接)
└── GPL-3.0 ✗ (不兼容，会强制开源)
```

### 3.3 许可证声明文件

所有第三方组件的许可证声明已包含在项目的 `THIRD_PARTY_LICENSES.md` 文件中：

```markdown
# Third Party Licenses

## TypeScript
- License: Apache-2.0
- Copyright: Microsoft Corporation
- Source: https://github.com/microsoft/TypeScript

## esbuild
- License: MIT
- Copyright: Evan Wallace
- Source: https://github.com/evanw/esbuild

## vitest
- License: MIT
- Copyright: Anthony Fu
- Source: https://github.com/vitest-dev/vitest
```

---

## 四、侵权责任划分条款

### 4.1 引擎方责任

**引擎方保证：**
1. 拥有本引擎的合法知识产权
2. 引擎不侵犯任何第三方知识产权
3. 提供的授权是合法有效的

**引擎方免责：**
1. 用户使用引擎开发的游戏内容侵权
2. 用户修改引擎代码导致的侵权
3. 用户引入的第三方资源侵权

### 4.2 用户方责任

**用户方保证：**
1. 使用引擎开发的内容不侵犯他人权利
2. 遵守目标平台的开发者协议
3. 合法使用第三方资源

**用户方义务：**
1. 保留引擎的版权声明
2. 按照授权范围使用引擎
3. 及时报告发现的安全漏洞

### 4.3 侵权处理流程

```
发现侵权 → 通知引擎方 → 引擎方调查 → 72小时内回复
    ↓
确认侵权 → 移除侵权内容 → 通知相关方 → 记录备案
    ↓
争议情况 → 法律途径解决
```

### 4.4 赔偿条款

| 侵权类型 | 赔偿上限 | 处理方式 |
|----------|----------|----------|
| 轻微侵权 | 授权费用的2倍 | 协商解决 |
| 一般侵权 | 授权费用的5倍 | 法律途径 |
| 严重侵权 | 实际损失 | 法律途径 |

---

## 五、全球市场合规要求

### 5.1 中国区合规

| 合规要求 | 说明 | 引擎支持 |
|----------|------|----------|
| **版号申请** | 游戏出版物号 | 引擎提供技术文档支持 |
| **ICP备案** | 网络信息服务 | H5版本需要 |
| **防沉迷系统** | 未成年人保护 | ✓ 已集成 |
| **实名认证** | 用户身份验证 | ✓ 接口已预留 |
| **内容审查** | 游戏内容合规 | 提供内容过滤API |

### 5.2 欧盟区合规 (GDPR)

| 合规要求 | 说明 | 引擎支持 |
|----------|------|----------|
| **数据最小化** | 只收集必要数据 | ✓ 默认配置 |
| **用户同意** | 明确的数据收集同意 | ✓ 弹窗组件 |
| **数据可携** | 用户数据导出 | ✓ API支持 |
| **删除权** | 用户数据删除 | ✓ API支持 |
| **数据保护** | 数据加密存储 | ✓ 加密模块 |

### 5.3 美国区合规 (COPPA)

| 合规要求 | 说明 | 引擎支持 |
|----------|------|----------|
| **年龄验证** | 13岁以下用户保护 | ✓ 年龄验证组件 |
| **家长同意** | 未成年人需家长同意 | ✓ 同意流程 |
| **数据限制** | 限制儿童数据收集 | ✓ 默认配置 |

### 5.4 韩国区合规

| 合规要求 | 说明 | 引擎支持 |
|----------|------|----------|
| **游戏分级** | GRAC分级系统 | 提供技术文档 |
| **概率公示** | 抽卡概率公开 | ✓ API支持 |
| **实名认证** | 韩国实名系统 | ✓ 接口预留 |

### 5.5 日本区合规

| 合规要求 | 说明 | 引擎支持 |
|----------|------|----------|
| **CERO分级** | 游戏分级制度 | 提供技术文档 |
| **景品表示法** | 虚假宣传禁止 | 提供内容审查API |
| **特定商取引法** | 电商法规 | 支付合规支持 |

---

## 六、合规报备模板

### 6.1 游戏发行商报备表

```markdown
# 游戏发行商报备表

## 基本信息
- 游戏名称：________________
- 版本号：________________
- 发行商：________________
- 开发商：________________
- 发行日期：________________

## 技术信息
- 引擎名称：Lite Game Engine
- 引擎版本：________________
- 授权级别：________________
- 授权编号：________________

## 目标平台
- [ ] 微信小游戏
- [ ] 抖音小游戏
- [ ] H5网页
- [ ] iOS App Store
- [ ] Google Play

## 合规声明
- [ ] 已完成版号申请
- [ ] 已完成ICP备案
- [ ] 已集成防沉迷系统
- [ ] 已完成实名认证
- [ ] 已完成内容审查
- [ ] 已完成隐私政策

## 签章
发行商代表签字：________________
日期：________________
```

### 6.2 技术合规证明

```markdown
# 技术合规证明

兹证明 [游戏名称] 使用 Lite Game Engine [版本号] 开发，
已通过以下技术合规验证：

1. 引擎授权验证：✓ 有效
2. 代码安全扫描：✓ 通过
3. 性能压力测试：✓ 通过
4. 兼容性测试：✓ 通过
5. 隐私合规检查：✓ 通过

证明编号：________________
签发日期：________________
签发人：________________
```

---

## 七、法律声明

### 7.1 适用法律

本协议受中华人民共和国法律管辖，任何争议应提交至引擎方所在地人民法院解决。

### 7.2 协议修改

引擎方保留随时修改本协议的权利，修改后的协议将在官方网站公布后30天生效。

### 7.3 联系方式

- **法律咨询**：legal@lite-engine.com
- **授权咨询**：license@lite-engine.com
- **投诉举报**：report@lite-engine.com

---

**文档版本历史**

| 版本 | 日期 | 修改内容 |
|------|------|----------|
| 1.0.0 | 2026-06-13 | 初始版本发布 |