/**
 * dsh-chat-width —— 调宽 dsh 网页会话区的聊天内容宽度（浏览器端）
 *
 * 实现机制与 dsh-theme-firefly 相同：
 *   1. window.__ModuleLoader__.load() 注册为 DSH 客户端模块；
 *   2. 导出 { isPlugin, inject: [], apply }；
 *   3. apply(ctx) 里 ctx.effect() 注入 <style>，覆盖会话根元素上的
 *      --dsh-chat-content-width（旧版 dsh 默认 748px → 本插件默认 1040px）。
 *
 * 交互（旧版 dsh < 0.1.7）：
 *   - 会话文字列右缘有一个可左右拖拽的把手（.dsh-cw-handle），拖动实时调整宽度，
 *     松开后记忆到 localStorage（键 dsh_chat_width）；双击把手恢复默认值。
 *   - 控制台也可执行 window.__setChatWidth(960)（范围 520~2400）直接设置。
 *
 * 版本自适应（dsh >= 0.1.7）：
 *   新版已内置聊天宽度把手（左右两侧全高把手 + --dsh-chat-user-width 钩子 +
 *   localStorage 键 dsh.conversation.contentWidth）。此时本插件彻底让位：不注入
 *   样式、不渲染把手，避免出现第二个失效的把手；__setChatWidth 改为驱动内置钩子。
 */
window.__ModuleLoader__.load({
	id: "dsh-chat-width",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;

		const LS_CHAT_WIDTH = "dsh_chat_width";
		const CHAT_WIDTH_DEFAULT = 1040;
		const WIDTH_MIN = 520;
		const WIDTH_MAX = 2400;

		// 读取 localStorage 记忆值，越界时回退默认
		function chatContentWidth() {
			const v = Number(localStorage.getItem(LS_CHAT_WIDTH));
			return Number.isFinite(v) && v >= WIDTH_MIN && v <= WIDTH_MAX ? Math.round(v) : CHAT_WIDTH_DEFAULT;
		}

		// ── 与 dsh 0.1.7+ 的兼容检测 ──────────────────────────────────────────
		// 新版把 --dsh-chat-content-width 定义在会话 body（.wSkVaW_body）上，而旧版定义在
		// 会话根元素（.wSkVaW_root）上——变量定义下沉后，在 root 上的覆盖会被 body 自身的
		// 声明遮蔽，这正是旧版插件在新版"拖了没反应"的原因。新版同时自带左右两个全高
		// 把手（[data-width-handle]）与官方钩子 --dsh-chat-user-width。
		// 检测到内置实现时，本插件彻底让位，不做任何覆盖。
		const LS_NATIVE_PREF = "dsh.conversation.contentWidth";

		function nativeWidthControls() {
			if (document.querySelector("[data-width-handle]") !== null) return true;
			const root = document.querySelector(".wSkVaW_root") || document.querySelector("[data-phase]");
			if (root === null) return false;
			const body = root.querySelector(".wSkVaW_body") || document.querySelector(".wSkVaW_body");
			if (body === null) return false;
			// 新版：变量只在 body 上定义 → body 非空而 root 为空；旧版两者同值（root 定义）
			const rootVar = getComputedStyle(root).getPropertyValue("--dsh-chat-content-width").trim();
			const bodyVar = getComputedStyle(body).getPropertyValue("--dsh-chat-content-width").trim();
			return bodyVar !== "" && rootVar === "";
		}

		function pluginCSS() {
			return [
				// ── 1) 宽度覆盖：会话根元素上的 --dsh-chat-content-width（dsh 默认 748px）──
				// 双类/双属性选择器把特异性提到 (0,2,0)，压过 dsh 自带定义，与样式加载顺序无关；
				// 若未来 dsh 版本改了类名哈希，[data-phase][data-phase] 兜底仍然命中会话根元素。
				".wSkVaW_root.wSkVaW_root,",
				"[data-phase][data-phase] {",
				"  --dsh-chat-content-width: " + chatContentWidth() + "px;",
				"  position: relative;",
				"}",
				"",
				// ── 2) 拖拽把手：锚定在文字列右缘（由 CSS 变量实时驱动，无需 JS 计算定位）──
				".dsh-cw-handle {",
				"  position: absolute;",
				"  top: 50%;",
				"  right: calc((100% - var(--dsh-chat-content-width)) / 2 - 7px);",
				"  width: 14px;",
				"  height: 72px;",
				"  transform: translateY(-50%);",
				"  z-index: 9;",
				"  cursor: ew-resize;",
				"  touch-action: none;",
				"  user-select: none;",
				"  -webkit-user-select: none;",
				"  display: flex;",
				"  align-items: center;",
				"  justify-content: center;",
				"  border-radius: 7px;",
				"  background: color-mix(in srgb, var(--dsw-alias-bg-layer-3, #141c2c) 72%, transparent);",
				"  border: 1px solid var(--dsw-alias-border-l2, rgba(255,255,255,0.14));",
				"  box-shadow: 0 2px 10px rgba(0,0,0,0.28);",
				"  opacity: 0.5;",
				"  transition: opacity 0.15s ease, background-color 0.15s ease;",
				"}",
				".dsh-cw-handle:hover,",
				".dsh-cw-handle.dragging {",
				"  opacity: 1;",
				"  background: color-mix(in srgb, var(--dsw-alias-button-floating-hover, #1b2942) 90%, transparent);",
				"}",
				".dsh-cw-grip {",
				"  width: 3px;",
				"  height: 30px;",
				"  border-radius: 2px;",
				"  background: var(--dsw-alias-label-tertiary, rgba(255,255,255,0.5));",
				"}",
				".dsh-cw-label {",
				"  position: absolute;",
				"  top: -26px;",
				"  left: 50%;",
				"  transform: translateX(-50%);",
				"  display: none;",
				"  padding: 2px 8px;",
				"  border-radius: 6px;",
				"  font-size: 11px;",
				"  line-height: 16px;",
				"  white-space: nowrap;",
				"  color: var(--dsw-alias-label-primary, #eafff3);",
				"  background: color-mix(in srgb, var(--dsw-alias-bg-overlay, #0f192b) 90%, transparent);",
				"  border: 1px solid var(--dsw-alias-border-l2, rgba(255,255,255,0.14));",
				"  pointer-events: none;",
				"  z-index: 10;",
				"}",
				".dsh-cw-handle.dragging .dsh-cw-label { display: block; }"
			].join("\n");
		}

		function makeHandle() {
			const el = document.createElement("div");
			el.className = "dsh-cw-handle";
			el.title = "拖拽调整聊天宽度 · 双击恢复默认";
			const grip = document.createElement("div");
			grip.className = "dsh-cw-grip";
			const label = document.createElement("div");
			label.className = "dsh-cw-label";
			el.append(grip, label);

			let dragging = false;
			let startX = 0;
			let startWidth = CHAT_WIDTH_DEFAULT;

			const currentWidth = () => {
				const root = el.parentElement;
				if (!root) return chatContentWidth();
				const v = parseFloat(root.style.getPropertyValue("--dsh-chat-content-width"));
				return Number.isFinite(v) ? v : chatContentWidth();
			};

			const setWidth = (w) => {
				const root = el.parentElement;
				if (!root) return;
				const maxW = Math.max(WIDTH_MIN, root.clientWidth - 40);
				const v = Math.min(Math.max(Math.round(w), WIDTH_MIN), WIDTH_MAX, maxW);
				root.style.setProperty("--dsh-chat-content-width", v + "px");
				label.textContent = v + "px";
				return v;
			};

			const persist = () => {
				const root = el.parentElement;
				const v = root ? parseFloat(root.style.getPropertyValue("--dsh-chat-content-width")) : NaN;
				if (Number.isFinite(v) && v >= WIDTH_MIN && v <= WIDTH_MAX) {
					localStorage.setItem(LS_CHAT_WIDTH, String(Math.round(v)));
					document.querySelectorAll("style[data-dsh-chat-width]").forEach((s) => { s.textContent = pluginCSS(); });
				}
			};

			const onMove = (e) => {
				if (!dragging) return;
				// 2× 映射：文字列居中布局下，右缘位移 = 宽度变化的一半。
				// 宽度按指针位移的 2 倍变化，把手（锚定在右缘）才能 1:1 跟手，
				// 且列始终居中、松手无回弹。
				setWidth(startWidth + 2 * (e.clientX - startX));
			};
			const onUp = () => {
				if (!dragging) return;
				dragging = false;
				el.classList.remove("dragging");
				el.removeEventListener("pointermove", onMove);
				el.removeEventListener("pointerup", onUp);
				el.removeEventListener("pointercancel", onUp);
				persist();
			};
			const onDown = (e) => {
				e.preventDefault();
				dragging = true;
				startX = e.clientX;
				startWidth = currentWidth();
				el.classList.add("dragging");
				label.textContent = Math.round(startWidth) + "px";
				try { el.setPointerCapture(e.pointerId); } catch (err) { /* 旧浏览器忽略 */ }
				el.addEventListener("pointermove", onMove);
				el.addEventListener("pointerup", onUp);
				el.addEventListener("pointercancel", onUp);
			};
			const onDbl = () => {
				localStorage.setItem(LS_CHAT_WIDTH, String(CHAT_WIDTH_DEFAULT));
				document.querySelectorAll("style[data-dsh-chat-width]").forEach((s) => { s.textContent = pluginCSS(); });
				const root = el.parentElement;
				if (root) root.style.setProperty("--dsh-chat-content-width", CHAT_WIDTH_DEFAULT + "px");
				console.log("[dsh-chat-width] 已恢复默认宽度 " + CHAT_WIDTH_DEFAULT + "px");
			};

			el.addEventListener("pointerdown", onDown);
			el.addEventListener("dblclick", onDbl);
			return el;
		}

		function apply(ctx) {
			ctx.effect(() => {
				let handle = null;
				let raf = 0;
				let yielded = false;

				// 让位给 dsh 内置实现：移除本插件注入的样式与把手
				const yieldToNative = () => {
					if (handle) { handle.remove(); handle = null; }
					document.querySelectorAll("style[data-dsh-chat-width]").forEach((s) => s.remove());
					if (!yielded) {
						yielded = true;
						console.info("[dsh-chat-width] 检测到 dsh 已内置聊天宽度把手（0.1.7+），本插件自动停用——直接拖拽文字列两侧的细长把手即可。");
					}
				};

				// 1) 注入样式（仅旧版 dsh；幂等：已存在则跳过）
				if (nativeWidthControls()) yieldToNative();
				else if (!document.querySelector("style[data-dsh-chat-width]")) {
					const style = document.createElement("style");
					style.dataset.dshChatWidth = "dsh-chat-width";
					style.textContent = pluginCSS();
					document.head.appendChild(style);
				}

				// 2) 把手挂到会话根元素上；会话可能在 boot 后才挂载（hero 阶段），
				//    用 MutationObserver 跟随根元素出现/切换，并随时检测内置实现是否出现。
				const attach = () => {
					if (raf) return;
					raf = requestAnimationFrame(() => {
						raf = 0;
						if (nativeWidthControls()) { yieldToNative(); return; }
						const root = document.querySelector(".wSkVaW_root") || document.querySelector("[data-phase]");
						if (!root) return;
						if (handle && handle.parentElement === root) return;
						if (handle) handle.remove();
						handle = makeHandle();
						root.appendChild(handle);
					});
				};
				attach();
				const mo = new MutationObserver(attach);
				mo.observe(document.body, { childList: true, subtree: true });

				// 3) 控制台助手：window.__setChatWidth(px)（520~2400）
				window.__setChatWidth = (px) => {
					const v = Math.round(Number(px));
					if (!Number.isFinite(v) || v < WIDTH_MIN || v > WIDTH_MAX) {
						console.warn("[dsh-chat-width] __setChatWidth(px)：px 需为 " + WIDTH_MIN + "~" + WIDTH_MAX + " 的数值，当前值被忽略");
						return;
					}
					// 新版：写入 dsh 自己的偏好键 + 官方钩子
					if (nativeWidthControls()) {
						localStorage.setItem(LS_NATIVE_PREF, String(v));
						const body = document.querySelector(".wSkVaW_body");
						const target = body === null ? null : (body.parentElement ?? body);
						if (target) target.style.setProperty("--dsh-chat-user-width", v + "px");
						console.log("[dsh-chat-width] 已通过 dsh 内置钩子把宽度设为 " + v + "px（新版可直接拖拽两侧把手）");
						return;
					}
					localStorage.setItem(LS_CHAT_WIDTH, String(v));
					document.querySelectorAll("style[data-dsh-chat-width]").forEach((s) => { s.textContent = pluginCSS(); });
					const root = document.querySelector(".wSkVaW_root") || document.querySelector("[data-phase]");
					if (root) root.style.setProperty("--dsh-chat-content-width", v + "px");
					console.log("[dsh-chat-width] 聊天内容宽度已设为 " + v + "px（dsh 原生 748px，本插件默认 " + CHAT_WIDTH_DEFAULT + "px）");
				};

				return () => {
					mo.disconnect();
					if (raf) cancelAnimationFrame(raf);
					if (handle) handle.remove();
					document.querySelectorAll("style[data-dsh-chat-width]").forEach((s) => s.remove());
					if (window.__setChatWidth) delete window.__setChatWidth;
				};
			}, "dsh-chat-width: apply");
		}

		exports.isPlugin = true;
		exports.inject = [];
		exports.apply = apply;
		return module.exports;
	}
});
