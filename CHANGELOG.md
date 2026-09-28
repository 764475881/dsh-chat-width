# Changelog

## 0.1.2 (2026-08-21)

- **兼容 dsh 0.1.7+**：新版已内置聊天宽度把手（左右两侧全高把手、`--dsh-chat-user-width` 钩子、
  localStorage 键 `dsh.conversation.contentWidth`）。插件现在自动检测内置实现并**彻底让位**
  ——不注入样式、不渲染自己的把手，避免与内置把手重叠出一个失效的死把手。
- 旧版 dsh（< 0.1.7）行为不变，仍由插件提供可拖拽把手。
- `window.__setChatWidth(px)` 在新版下改为驱动内置钩子（写入官方偏好键 + 设置 `--dsh-chat-user-width`）。

### 为什么旧版本在新版 dsh 上会失效

旧版 dsh 把 `--dsh-chat-content-width` 定义在会话根元素 `.wSkVaW_root` 上，插件在 root 上覆盖即可生效。
0.1.7 起该变量下沉到会话 body：

```css
.wSkVaW_body { --dsh-chat-content-width: var(--dsh-chat-user-width, clamp(680px, calc(var(--dsh-conversation-column-width,0px) * .64), 920px)); }
```

body 自身的声明会遮蔽从 root 继承的值，因此插件在 root 上的覆盖不再影响内容宽度——表现出来就是
「把手能拖动、文字却没变宽」。

## 0.1.1 (2026-08-19)

- 补充仓库元数据（repository/homepage/bugs 字段），便于插件市场与文档索引。
- README 新增「插件市场安装」说明；新增 `docs/DESIGN.md` 记录关键实现决策。

## 0.1.0 (2026-08-19)

- 首个可用版本：通过客户端 CSS 覆盖 `--dsh-chat-content-width`（dsh 默认 748px → 1040px）。
- 会话文字列右缘提供可拖拽把手：左右拖动实时调整宽度、双击恢复默认、选择记忆到 localStorage。
- 拖拽采用 2× 映射，把手 1:1 跟随鼠标（居中布局下右缘位移 = 宽度变化的一半）。
- 控制台助手 `window.__setChatWidth(px)`（520~2400）。
- 与 dsh 官方类名解耦的兜底选择器 `[data-phase][data-phase]`，dsh 升级后仍可命中。
