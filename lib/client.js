/**
 * dsh-chat-width —— 调宽 dsh 网页会话区的聊天内容宽度（浏览器端）
 *
 * 实现机制与 dsh-theme-firefly 相同：
 *   1. window.__ModuleLoader__.load() 注册为 DSH 客户端模块；
 *   2. 导出 { isPlugin, inject: [], apply }；
 *   3. apply(ctx) 里 ctx.effect() 注入 <style>，覆盖会话根元素上的
 *      --dsh-chat-content-width（dsh 默认 748px → 本插件 1040px）。
 *
 * 调整宽度：浏览器控制台执行 window.__setChatWidth(960)（范围 400~2400），
 * 立即生效并记忆到 localStorage（键 dsh_chat_width），刷新后仍保留。
 */
window.__ModuleLoader__.load({
	id: "dsh-chat-width",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;

		const LS_CHAT_WIDTH = "dsh_chat_width";
		const CHAT_WIDTH_DEFAULT = 1040;

		// 读取 localStorage 记忆值，越界时回退默认
		function chatContentWidth() {
			const v = Number(localStorage.getItem(LS_CHAT_WIDTH));
			return Number.isFinite(v) && v >= 400 && v <= 2400 ? Math.round(v) : CHAT_WIDTH_DEFAULT;
		}

		function widthCSS() {
			return [
				// 覆盖 dsh 会话根元素上的 --dsh-chat-content-width（dsh 默认 748px）。
				// 双类/双属性选择器把特异性提到 (0,2,0)，压过 dsh 自带定义，与样式加载顺序无关。
				// 若未来 dsh 版本改了类名哈希，[data-phase][data-phase] 兜底仍然命中会话根元素。
				".wSkVaW_root.wSkVaW_root,",
				"[data-phase][data-phase] {",
				"  --dsh-chat-content-width: " + chatContentWidth() + "px;",
				"}"
			].join("\n");
		}

		function apply(ctx) {
			ctx.effect(() => {
				// 1) 注入宽度覆盖样式（幂等：已存在则跳过）
				if (!document.querySelector("style[data-dsh-chat-width]")) {
					const style = document.createElement("style");
					style.dataset.dshChatWidth = "dsh-chat-width";
					style.textContent = widthCSS();
					document.head.appendChild(style);
				}

				// 2) 实时调节助手：控制台执行 window.__setChatWidth(px)（400~2400）
				window.__setChatWidth = (px) => {
					const v = Math.round(Number(px));
					if (!Number.isFinite(v) || v < 400 || v > 2400) {
						console.warn("[dsh-chat-width] __setChatWidth(px)：px 需为 400~2400 的数值，当前值被忽略");
						return;
					}
					localStorage.setItem(LS_CHAT_WIDTH, String(v));
					document.querySelectorAll("style[data-dsh-chat-width]").forEach((s) => { s.textContent = widthCSS(); });
					const root = document.querySelector(".wSkVaW_root") || document.querySelector("[data-phase]");
					if (root) root.style.setProperty("--dsh-chat-content-width", v + "px");
					console.log("[dsh-chat-width] 聊天内容宽度已设为 " + v + "px（dsh 原生 748px，本插件默认 1040px）");
				};

				return () => {
					// 卸载时清理
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
