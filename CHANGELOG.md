# Changelog

## 0.1.0 (2026-08-19)

- 首个可用版本：通过客户端 CSS 覆盖 `--dsh-chat-content-width`（dsh 默认 748px → 1040px）。
- 会话文字列右缘提供可拖拽把手：左右拖动实时调整宽度、双击恢复默认、选择记忆到 localStorage。
- 拖拽采用 2× 映射，把手 1:1 跟随鼠标（居中布局下右缘位移 = 宽度变化的一半）。
- 控制台助手 `window.__setChatWidth(px)`（520~2400）。
- 与 dsh 官方类名解耦的兜底选择器 `[data-phase][data-phase]`，dsh 升级后仍可命中。
