# Changelog

## 0.1.2 (2026-08-20)

- **修复**：兜底选择器 `[data-phase][data-phase]` 会同时命中 composer 输入框的 textarea（官方输入框也携带 `data-phase` 属性），其 `position:absolute` 被覆盖为 `relative` 后高度塌缩回两行，且官方输入框自身 `overflow:hidden` 不可滚动——多行文字时光标只能出现在最上面两行。现改为 `[data-phase][data-phase]:not(textarea)`，精确排除输入框；会话根元素仍被正常命中，宽度调节功能不变。

## 0.1.1 (2026-08-19)

- 补充仓库元数据（repository/homepage/bugs 字段），便于插件市场与文档索引。
- README 新增「插件市场安装」说明；新增 `docs/DESIGN.md` 记录关键实现决策。

## 0.1.0 (2026-08-19)

- 首个可用版本：通过客户端 CSS 覆盖 `--dsh-chat-content-width`（dsh 默认 748px → 1040px）。
- 会话文字列右缘提供可拖拽把手：左右拖动实时调整宽度、双击恢复默认、选择记忆到 localStorage。
- 拖拽采用 2× 映射，把手 1:1 跟随鼠标（居中布局下右缘位移 = 宽度变化的一半）。
- 控制台助手 `window.__setChatWidth(px)`（520~2400）。
- 与 dsh 官方类名解耦的兜底选择器 `[data-phase][data-phase]`，dsh 升级后仍可命中。
