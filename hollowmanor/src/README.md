# 幽宅双影 源码

- `00_core.js` … `99_boot.js`：按编号顺序拼接成一个 `<script>`：核心与数值表（`BAL`、角色 `ROLES`、证据 `EVID`、怨灵 `GHOSTS`、宅主 `BOSS`、遗物 `ITEMS`、镇物 `ANCHORS`）→ 地图引擎：碰撞、视线、寻路、互动点生成（`10_map.js`，`buildMap(fi)` 读 `FLOORS[fi]`）→ 三层楼的数据表（`11_floor1.js` / `12_floor2.js` / `13_floor3.js`：房间、门、家具、灯、机关、目标与提示、每层数值覆盖 `bal`）→ 程序化纹理与材质（墙纸、木地板、地毯……，`20_tex.js`，含墙体剖切着色器）→ 家具与建筑模型（`21_models_env.js`）→ 角色骨架与通用件（`22_models_chars.js`）→ 怨灵的真身形态与面纱形态（`23_models_ghosts.js`）→ 二楼、阁楼的家具和镇物（`24_models_upper.js`）→ 两位主角（`25_models_heroes.js`：变形球体头型 + 画布手绘脸贴片、条带发丝、物理材质）→ 主机权威模拟（`30_sim.js`：楼层切换、`PZ` 机关表、恐惧、证据、仪式）→ 怨灵 AI（`35_ghost.js`：游荡、闹鬼事件、猎杀、僵直）→ 场景组装与静态合批（`50_render.js`）→ 每帧画面（`51_frame.js`：手电阴影、灵视、雷电、后期）→ 合成音效（`60_audio.js`）→ 键鼠 / 触屏（`62_input.js`）→ 联机（`70_net.js`）→ 界面（`80_ui.js`）→ 主循环（`90_main.js`）→ 启动。
- `template.html`：页面骨架、CSS 和界面 DOM（含 iPhone 横竖屏适配，见仓库根目录 `IPHONE.md`）。
- `three.vendor.js`：three.js r160 + RoundedBoxGeometry + mergeGeometries，打包成全局 `THREE`（`npx esbuild vendor_entry.js --bundle --format=iife --global-name=THREE --minify`）。
- `build.py`：输出 `out/index.html` 和 `out/test.html`（带 `window.__dbg` 测试钩子，支持 `?solo=1&seed=&role=&floor=` 单机测试，同伴是跟随机器人），加 `--deploy` 时写 `../index.html`。只做双人联机，所以没有 claude.ai artifact 版本（artifact 屏蔽 WebRTC）。
- 存档（localStorage，前缀 `hollowmanor.`）：`settings` 设置、`mute`、`prog`（解锁到的楼层）。
- `test/`：Playwright 测试（`npm i playwright peer peerjs express`，用预装 Chromium）。先 `node test/serve.js out 8765`：
  `smoke.js`（单机跑 3 分钟模拟）、`flow.js`（用真实互动代码从头打通一层：证据→保险丝→暗门→电力→符文锁→遗物→双拉杆→错误献祭→正确献祭→上楼）、`flow23.js`（接着打通二楼和阁楼：阀门与钥匙、铜铃顺序、裂缝与门闩、梳妆镜仪式、油灯、镇物、法阵守护、天窗通关）、`shots.js`（按 `SHOTS` 环境变量截图，`Q` 追加查询参数；`window.__dbg.cam=[x,y,z, tx,ty,tz]` 可以把镜头摆到任意位置看模型特写）、`phone.js`（iPhone / iPad / 桌面布局与出屏检查）、`coop.js`（两个真客户端联机：大厅、换角色、开始、客机移动与拾取、快捷信号、掉线；需 `node test/peerserver.js`）。
