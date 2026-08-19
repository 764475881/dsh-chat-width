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
- `[data-phase][data-phase]`：版本无关兜底。dsh 未来若改了类名哈希，会话根元素（带 `data-phase` 属性）仍会被命中；双属性同样保证 (0,2,0)。

两个选择器都只匹配会话根元素，不会误伤其它 UI。

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

## 生命周期

- 会话根元素在 boot 后才挂载（hero 阶段），插件用 `MutationObserver` 观察 `[data-phase]` 根元素的出现/切换，把把手挂到当前根元素上；换会话自动迁移。
- 所有宽度选择写入 localStorage（键 `dsh_chat_width`），刷新/换会话后仍生效。
- 插件卸载时移除样式与把手，不残留任何全局副作用（`__setChatWidth` 一并删除）。
