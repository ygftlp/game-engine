# GameX Engine Skills

本目录包含 GameX Engine 的 AI 开发技能包，可供多种AI工具使用。

## 目录结构

```
skills/
└── gamex-engine/
    ├── SKILL.md          # 主技能文件（触发条件 + 快速参考）
    └── API-Reference.md  # 完整API文档
```

## 使用方式

### MiMoCode / Codex

将 skill 链接到全局 skills 目录：

```bash
# Windows
mklink /J "%USERPROFILE%\.codex\skills\gamex-engine" "D:\JavaWorkspace\game-engine\skills\gamex-engine"

# macOS/Linux
ln -s /path/to/game-engine/skills/gamex-engine ~/.codex/skills/gamex-engine
```

### Claude Code

在项目根目录创建 `.claude/settings.json`：

```json
{
  "skills": [
    "skills/gamex-engine/SKILL.md"
  ]
}
```

### 其他 AI 工具

直接引用 `skills/gamex-engine/SKILL.md` 文件。

## Skill 内容

| 文件 | 说明 |
|------|------|
| `SKILL.md` | 触发条件、API速查、代码示例、开发模式 |
| `API-Reference.md` | 完整API文档（1500+行） |

## 触发关键词

当用户提到以下内容时，AI会自动加载此skill：
- 游戏开发、小游戏、gamex、game engine
- 微信游戏、抖音游戏、H5游戏
- Canvas游戏、2D游戏
- Scene、Node、Sprite、Input、Collision等引擎API
