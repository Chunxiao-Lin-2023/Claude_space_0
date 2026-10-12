# 沙丘乱斗 源码

- `00_core.js` … `99_boot.js`：按编号顺序拼接成一个 `<script>`：核心与数值表（`BAL` / `DIFF` / `HEROES` / `GADGETS` / `STARS`）→ 地图/寻路 → 3D 模型与皮肤 → 模拟 → 模式、地图机关、随机事件、副技能、星徽（`35_modes.js`）→ AI（性格、指令跟随）→ 渲染 → 模式渲染与表情/标记（`55_modes_render.js`）→ 音效与输入 → 联机（最多 6 人）→ 界面与主循环 → 奖杯/金币/任务/成就（`85_meta.js`）→ 启动。
- `template.html`：页面骨架、CSS 和界面 DOM。
- `three.vendor.js`：three.js r160 + RoundedBoxGeometry + mergeGeometries，打包成全局 `THREE`（`npx esbuild vendor_entry.js --bundle --format=iife --global-name=THREE --minify`）。
- `build.py`：输出 `out/test.html`（带 `window.__dbg` 测试钩子）、`out/artifact.html`（单人预览版），加 `--deploy` 时写 `../index.html`。
- 存档（localStorage，前缀 `dunerumble.`）：`sel` 选择、`settings` 设置、`prog` 奖杯/金币/皮肤/任务/成就、`mute`。
- `test/`：Playwright 测试（`npm i playwright peer peerjs express`，用预装 Chromium）。先把 `out/` 起在 8765 端口：
  `modes.js`（无渲染跑完每个模式）、`ui2.js`（菜单、设置、任务、每个模式打到结算）、`shots2.js`（iPad 横竖屏/左手截图）、`sim.js`（胜率与时长）、`probe.js`、`perf.js`（绘制调用数）、
  `coop4.js`（房主 + 3 个客人联机：大厅、真人对抗分队、输入同步、掉线转 AI、回房间；需 `node test/peerserver.js`）；`hub.js` 需要把仓库根目录起在 8766 端口。
