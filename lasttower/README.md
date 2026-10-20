# 尸夜孤楼 Last Tower

侧视剖面的双人丧尸生存游戏：白天出门搜物资、在两根黄色标杆之间一层层盖楼、在工作台造枪；夜里尸潮从地图两边涌来，守住电台撑过 15 夜，等救援直升机。

- **建造**：木墙 / 砖墙 / 钢墙、木地板 / 钢地板（单向楼板）、梯子、木门（人能过、丧尸只能砸）、射击栅栏（子弹能穿）、铁丝网、探照灯。方块要有**支撑**：从地面往上传，往旁边每格减 1，支撑断了会连锁坍塌。
- **丧尸**：游荡者、疾跑者、攀爬者（翻墙、爬梯子）、喷吐者（远程吐酸）、重锤（拆墙）、血月巨尸（第 5 / 10 / 15 夜）。挡路就砸，人多了会叠罗汉翻墙。
- **武器**：手枪、霰弹枪、步枪、狙击枪（穿透）、推开、手雷、医疗包；工作台造枪、造弹药、强化弹头、加固电台。
- **双人**：PeerJS 联机，房主权威；材料全队共用；倒地后队友按住 E 扶起，或用医疗包自救；阵亡的人天亮后在电台旁复活。

## 源码

- `src/` 下按序拼接：`00_core.js`（数据表、平衡参数 `BAL`）、`10_world.js`（地图、碰撞、支撑与坍塌）、`30_sim.js`（玩家、武器、建造、搜刮、制作、昼夜与刷怪）、`35_zombies.js`（丧尸 AI）、`50_render.js`（Canvas 程序绘制、光照、特效）、`60_audio.js`（合成音效）、`62_input.js`（键鼠 + 触屏）、`70_net.js`（联机）、`80_ui.js`、`90_main.js`、`99_boot.js`；页面骨架 `template.html`。
- 构建：`python3 lasttower/src/build.py --deploy`（写 `../index.html`；`src/out/` 里另有 `test.html`（带 `window.__dbg`）和 `artifact.html`（单人版））。
- 测试（`src/out/` 用 `node test/serve.js . 8765` 起服务）：`test/smoke.js`、`test/shots.js`、`test/phone.js`（iPad / iPhone 横竖屏触屏）、`test/coop.js`（需 `node test/peerserver.js`）、`test/balance.js`（机器人守夜探平衡）、`test/cover.js`（游戏厅封面）。
- 本地存储键前缀 `lasttower.`；联机房间 id 前缀 `lasttower-`。
