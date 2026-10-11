# 裂隙守卫 源码

- `game/`：按顺序拼接成单文件游戏的源码片段（a_shell → k_main）。`b_maps.js` 由 `tools/maps.py` 生成。
- `render/`：three.js 程序化建模 + 无头 Chromium 渲染 8 方向帧（`node render/run.mjs units|props`）。
- `tools/pack.py`：把渲染帧打包成 WebP 图集 `atlas/`。
- `build.py`：拼接 + 注入图集，输出 standalone / artifact / test 三个版本（路径按原工作目录 `riftwork/` 结构：work/src、work/atlas、out）。
- `test/`：单人冒烟、双客户端联机（本地 peer 服务器）、触屏、功能探针、菜单、寻路模拟。
