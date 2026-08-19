# dsh-chat-width

调宽 dsh 网页会话区的聊天内容宽度。dsh 原生把会话文字列限制在 **748px**，在大屏上左右浪费大量空间；本插件通过客户端 CSS 把 `--dsh-chat-content-width` 覆盖为 **1040px**（默认值，可调）。

输入框、底部工具栏等宽度由同一变量派生（`calc(var(--dsh-chat-content-width) + 32px)`），会自动跟着变宽。

## 调整宽度

两种方式，任选其一：

1. **拖拽把手**（推荐）：会话文字列**右缘**（垂直中点）有一个细长的竖向把手，鼠标按住左右拖动即可实时调整宽度，松开自动记忆。**双击把手恢复默认值 1040px**。把手的半透明样式与主题融合，悬停/拖动时高亮。
2. **控制台**（F12）：

   ```js
   __setChatWidth(960)   // 任意值，范围 520~2400，立即生效
   __setChatWidth(1040)  // 恢复默认
   ```

选择会记忆到 localStorage（键 `dsh_chat_width`），下次打开页面仍生效。

## 安装

**方式一：插件市场（推荐）** —— 在 dsh 网页的设置 → 插件市场中搜索 `dsh-chat-width`，一键安装。

**方式二：命令行**（dsh >= 0.1.0-rc.7）：

```bash
dsh plugin --profile web add github:764475881/dsh-chat-width
```

**方式三：本地开发（link）**：

```bash
# 在 web profile 目录（~/.dsh/profiles/web）下
pnpm add link:/home/miku/dsh-chat-width
# 并在该 profile 的 package.json 中把 "dsh-chat-width" 加入 dsh.profile.bundles
# 然后重启 dsh web（新增 bundle 需重启生效）
```

卸载同理：从 `package.json` 的 dependencies 与 bundles 移除，`pnpm install`，重启。

## 原理

- 服务端占位 `lib/index.js`：空 `apply`，仅让 loader 行可挂载。
- 客户端 `lib/client.js`：注册为 DSH 客户端模块，注入 `<style>` 覆盖：
  - `.wSkVaW_root.wSkVaW_root`（当前 dsh 版本的会话根元素类名）
  - `[data-phase][data-phase]`（版本无关兜底选择器，特异性 (0,2,0) 压过 dsh 自带定义）
- 拖拽把手 `.dsh-cw-handle` 绝对定位锚定在文字列右缘：`right: calc((100% - var(--dsh-chat-content-width)) / 2 - 7px)`，宽度变化由 CSS 变量实时驱动，无需 JS 计算位置；pointer 事件 + setPointerCapture 完成拖拽，松手写入 localStorage。
- **跟手映射**：文字列居中布局下右缘位移 = 宽度变化的一半，因此拖拽时宽度按指针位移的 **2×** 变化，把手（锚定右缘）才能 1:1 跟随鼠标，且列始终居中、松手无回弹。
- 会话根元素可能在 boot 后才挂载（hero 阶段），插件用 MutationObserver 跟随根元素出现/切换并挂载把手。

详细设计决策见 [docs/DESIGN.md](docs/DESIGN.md)。

## 开发

```bash
node --check lib/client.js
```

改完 `lib/client.js` 后，运行中的 dsh 会在约 1 秒内通过 HMR 热替换（无需重启）。
