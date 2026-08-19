# dsh-chat-width

调宽 dsh 网页会话区的聊天内容宽度。dsh 原生把会话文字列限制在 **748px**，在大屏上左右浪费大量空间；本插件通过客户端 CSS 把 `--dsh-chat-content-width` 覆盖为 **1040px**（默认值，可调）。

输入框、底部工具栏等宽度由同一变量派生（`calc(var(--dsh-chat-content-width) + 32px)`），会自动跟着变宽。

## 安装

```bash
# 在 web profile 目录（~/.dsh/profiles/web）下
pnpm add link:/home/miku/dsh-chat-width
# 并在该 profile 的 package.json 中把 "dsh-chat-width" 加入 dsh.profile.bundles
# 然后重启 dsh web（新增 bundle 需重启生效）
```

卸载同理：从 `package.json` 的 dependencies 与 bundles 移除，`pnpm install`，重启。

## 调整宽度

打开浏览器控制台（F12）：

```js
__setChatWidth(960)   // 任意值，范围 400~2400，立即生效
__setChatWidth(1040)  // 恢复默认
```

选择会记忆到 localStorage（键 `dsh_chat_width`），下次打开页面仍生效。

## 原理

- 服务端占位 `lib/index.js`：空 `apply`，仅让 loader 行可挂载。
- 客户端 `lib/client.js`：注册为 DSH 客户端模块，注入 `<style>` 覆盖：
  - `.wSkVaW_root.wSkVaW_root`（当前 dsh 版本的会话根元素类名）
  - `[data-phase][data-phase]`（版本无关兜底选择器，特异性 (0,2,0) 压过 dsh 自带定义）

## 开发

```bash
node --check lib/client.js
```

改完 `lib/client.js` 后，运行中的 dsh 会在约 1 秒内通过 HMR 热替换（无需重启）。
