# 幽宅双影 源码

- `00_core.js` … `99_boot.js`：按编号顺序拼接成一个 `<script>`：核心与数值表（`BAL`、角色 `ROLES`、证据 `EVID`、怨灵 `GHOSTS`、遗物 `ITEMS`）→ 楼层布局、碰撞、视线、寻路（`10_map.js`，房间 / 门 / 窗 / 家具 / 机关全是数据表）→ 程序化纹理与材质（墙纸、木地板、地毯……，`20_tex.js`，含墙体剖切着色器）→ 家具与建筑模型（`21_models_env.js`）→ 角色、怨灵、遗物模型（`22_models_chars.js`）→ 主机权威模拟（`30_sim.js`：互动、恐惧、证据、仪式）→ 怨灵 AI（`35_ghost.js`：游荡、闹鬼事件、猎杀、僵直）→ 场景组装与静态合批（`50_render.js`）→ 每帧画面（`51_frame.js`：手电阴影、灵视、雷电、后期）→ 合成音效（`60_audio.js`）→ 键鼠 / 触屏（`62_input.js`）→ 联机（`70_net.js`）→ 界面（`80_ui.js`）→ 主循环（`90_main.js`）→ 启动。
- `template.html`：页面骨架、CSS 和界面 DOM（含 iPhone 横竖屏适配，见仓库根目录 `IPHONE.md`）。
- `three.vendor.js`：three.js r160 + RoundedBoxGeometry + mergeGeometries，打包成全局 `THREE`（`npx esbuild vendor_entry.js --bundle --format=iife --global-name=THREE --minify`）。
- `build.py`：输出 `out/index.html` 和 `out/test.html`（带 `window.__dbg` 测试钩子，支持 `?solo=1&seed=&role=` 单机测试，同伴是跟随机器人），加 `--deploy` 时写 `../index.html`。只做双人联机，所以没有 claude.ai artifact 版本（artifact 屏蔽 WebRTC）。
- 存档（localStorage，前缀 `hollowmanor.`）：`settings` 设置、`mute`。
- `test/`：Playwright 测试（`npm i playwright peer peerjs express`，用预装 Chromium）。先 `node test/serve.js out 8765`：
  `smoke.js`（单机跑 3 分钟模拟）、`flow.js`（用真实互动代码从头打通一层：证据→保险丝→暗门→电力→符文锁→遗物→双拉杆→错误献祭→正确献祭→上楼）、`shots.js`（按 `SHOTS` 环境变量截图）、`phone.js`（iPhone / iPad / 桌面布局与出屏检查）、`coop.js`（两个真客户端联机：大厅、换角色、开始、客机移动与拾取、快捷信号、掉线；需 `node test/peerserver.js`）。
