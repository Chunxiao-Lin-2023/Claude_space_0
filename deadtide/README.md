# 尸潮堡垒 Dead Tide

低多边形 3D 斜俯视（Three.js 正交相机）的双人丧尸生存游戏，是侧视版「尸夜孤楼」的 2.5D 版本。64×64 的地图上有河流和两座桥、山坡和坡道、树林、石头、水塘、公路和废弃小镇。白天砍树采石、搜汽车 / 补给箱 / 瓦砾，在电台周围的黄框里一层层盖堡垒、在工作台造枪；夜里尸潮从地图边缘涌来，守住电台撑过 15 夜。

- **视角**：滚轮 / ＋－ 缩放，Q E / ⟲⟳ 90° 转镜头。楼层视图默认自动：在屋顶下时会隐藏你头顶的楼层，在室外显示全部；▲▼（PageUp / PageDown）手动逐层查看，「跟随我所在的层」恢复。建造放在当前视图层（自动时是你所在的层）。墙挡住你时自动切矮。
- **建造**：木 / 砖 / 钢墙、木 / 钢楼板、楼梯（R 转朝向）、木门、射击栅栏、铁丝网、探照灯。三维支撑：从地面往上传，水平每格减 1，断了会连锁坍塌。
- **丧尸**：流场寻路（会算上砸墙的代价，所以会挑最薄弱的地方砸），走楼梯和山坡；攀爬者会翻墙上楼；喷吐者远程吐酸；重锤拆墙；血月（第 5 / 10 / 15 夜）有巨尸，尸潮从四面来。
- **双人**：PeerJS，房主权威，材料共用；倒地后队友按住 F 扶起或医疗包自救。

## 源码

- `src/` 按序拼接：`00_core.js`（数据表、`BAL`）、`10_world.js`（分层网格、地形生成、三维支撑）、`20_nav.js`（移动、楼梯 / 坡道、流场、三维射线）、`30_sim.js`、`35_zombies.js`、`50_render.js`（Three.js：合并地形网格 + 实例化方块 / 树 / 丧尸，切层、光照、小地图）、`60_audio.js`、`62_input.js`、`70_net.js`、`80_ui.js`、`90_main.js`、`99_boot.js`；`template.html`；`three.vendor.js`（three r160 + mergeGeometries，和幽宅双影同一份）。
- 构建：`python3 deadtide/src/build.py --deploy`；`src/out/` 另有 `test.html`（带 `window.__dbg`）和 `artifact.html`（单人版）。
- 测试（`node test/serve.js out 8766`）：`test/smoke.js`、`test/phone.js`、`test/coop.js`（需 `node test/peerserver.js`）、`test/balance.js`、`test/cover.js`。无头 Chromium 的软件渲染很慢，测试时关掉绘制（`__dbg.skipDraw`），只在截图时渲染。
- 本地存储键前缀 `deadtide.`；联机房间 id 前缀 `deadtide-`。
