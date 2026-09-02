# 设计说明（DESIGN）

本文记录 dsh-chat-width 的关键实现决策，供维护者与贡献者参考。

## 为什么覆盖 CSS 变量而不是改组件

dsh 的会话区布局由 `--dsh-chat-content-width` 控制（定义在会话根元素 `.wSkVaW_root` 上，默认 **748px**），文字列、输入框、底部工具栏的宽度都由它派生：

```css
.wSkVaW_root { --dsh-chat-content-width: 748px; ... }
.flow { width: 100%; max-width: var(--dsh-chat-content-width); margin: 0 auto; }
.composer { max-width: calc(var(--dsh-chat-content-width) + 32px); }
```

因此只要覆盖这一个变量，整条会话链路的宽度同步变化，无需改动任何 dsh 内部组件，也无需重新构建前端。

## 选择器策略：类名哈希 + 属性兜底

- `.wSkVaW_root.wSkVaW_root`：双类把特异性提到 (0,2,0)，压过 dsh 自带定义，与样式注入顺序无关。
- `[data-phase][data-phase]:not(textarea)`：版本无关兜底。dsh 未来若改了类名哈希，会话根元素（带 `data-phase` 属性）仍会被命中；双属性保证 (0,2,0)，`:not(textarea)` 追加 (0,0,1) 后为 (0,2,1)。

dsh 前端恰好只有两个元素携带 `data-phase`：会话根元素与 composer 输入框的 textarea。输入框的官方样式是 `position:absolute; inset:0; overflow:hidden`（铺满由隐藏 mirror 撑高的容器，自身永不滚动），若被兜底选择器命中，`position` 会被覆盖为 `relative`，高度塌缩回 `rows=2` 的固有高度——多行文字时光标只能停在最上面两行。故必须显式排除。

两个选择器都只匹配会话根元素（`:not(textarea)` 排除了唯一会误伤的 composer 输入框）。

## 拖拽把手的定位：CSS 变量驱动，零 JS 定位

把手绝对定位锚定在文字列右缘：

```css
.dsh-cw-handle {
  right: calc((100% - var(--dsh-chat-content-width)) / 2 - 7px);
}
```

文字列居中（`margin: 0 auto`），右缘到容器右缘的距离恰为 `(100% - 宽度)/2`。宽度一变，把手位置自动跟上，不需要监听 scroll/resize 或逐帧计算。

## 跟手映射：为什么是 2×

文字列居中布局下，宽度变化 dx 时**左右边缘各移动 dx/2**。若宽度按指针位移 1× 变化，锚定在右缘的把手只走指针的一半距离，手感滞后。

因此拖拽时宽度按指针位移的 **2×** 变化：

```js
setWidth(startWidth + 2 * (e.clientX - startX))
```

这样右缘（把手）与指针 1:1，列始终居中，松手无回弹。代价是宽度数值变化比指针快一倍——这是居中布局下"边缘跟手"的必然取舍。

## 用户消息气泡：官方硬上限的独立覆盖

调宽变量后，会话文字列、composer 输入框、底部工具栏都会跟随——但**用户消息气泡不会**：官方把承载用户消息（以及 steering / 排队消息气泡，共用 `UserStyleBubble`）的栈硬钉在

```css
.gdEzaW_userStack { max-width: min(525px, 82%); }
```

这是组件内部的固定像素上限，与 `--dsh-chat-content-width` 完全无关。大屏上调宽会话区后，用户消息仍是一条 525px 的窄带——这正是「回复很宽、我的输入很窄」观感的来源。

### 覆盖方式

```css
.gdEzaW_root 上新变量：
  --dshcw-user-bubble-max-width: min(calc(var(--dsh-chat-content-width) * 0.8), 82%);
.gdEzaW_userStack.gdEzaW_userStack { max-width: var(--dshcw-user-bubble-max-width); }
```

- **双类选择器**把特异性提到 (0,2,0)，压过官方 (0,1,0)，与样式注入顺序无关。
- **保留 82% 硬上限**：比例可调到 1，此时 82% 兜底，防止气泡完全贴满文字列、与 assistant 消息失去视觉区分。
- **默认比例 0.8**：官方在 748px 列宽下的观感比例是 525/748 ≈ 0.70；取 0.8 让大屏下明显更宽，又不至于贴边。控制台 `__setUserBubbleRatio(r)`（0.3~1）可调，记忆到 localStorage 键 `dsh_user_bubble_ratio`。
- **变量前缀 `--dshcw-`**：官方变量均为 `--dsh-*` 命名空间，插件自定义变量加前缀避免未来版本冲突。
- **版本容错**：`gdEzaW` 是 CSS Modules 哈希类名，dsh 升级可能改变。该规则失效时只是回退官方 525px 上限，不破坏任何布局；与 `.wSkVaW_root` 不同，气泡栈没有稳定的属性选择器可作兜底，故接受此退化。

## 生命周期

- 会话根元素在 boot 后才挂载（hero 阶段），插件用 `MutationObserver` 观察 `[data-phase]` 根元素的出现/切换，把把手挂到当前根元素上；换会话自动迁移。
- 所有宽度选择写入 localStorage（键 `dsh_chat_width`），刷新/换会话后仍生效。
- 插件卸载时移除样式与把手，不残留任何全局副作用（`__setChatWidth`、`__setUserBubbleRatio` 一并删除）。
