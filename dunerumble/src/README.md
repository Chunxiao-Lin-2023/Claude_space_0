# 沙丘乱斗 源码

- `00_core.js` … `80_main.js`：按编号顺序拼接成一个 `<script>`（核心与数值表 → 地图/寻路 → 3D 模型 → 模拟 → AI → 渲染 → 音效与输入 → 联机 → 界面与主循环）。所有数值在 `00_core.js` 的 `BAL` / `DIFF` / `HEROES` 里。
- `template.html`：页面骨架、CSS 和界面 DOM。
- `three.vendor.js`：three.js r160 + RoundedBoxGeometry + mergeGeometries，打包成全局 `THREE`（`npx esbuild vendor_entry.js --bundle --format=iife --global-name=THREE --minify`）。
- `build.py`：输出 `out/test.html`（带 `window.__dbg` 测试钩子）、`out/artifact.html`（单人预览版），加 `--deploy` 时写 `../index.html`。
- `test/`：Playwright 测试（`npm i playwright peer peerjs express`，用预装 Chromium）。先把 `out/` 起在 8765 端口：`sim.js`（无渲染整局模拟、胜率与时长）、`smoke.js`、`probe.js`（草丛隐身、各大招、双人复活、暂停、键盘菜单）、`touch.js`（iPad 横竖屏触摸）、`coop.js`（双客户端联机，需 `node test/peerserver.js`）、`perf.js`（绘制调用数）；`hub.js` 需要把仓库根目录起在 8766 端口。
