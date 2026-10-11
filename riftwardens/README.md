# 裂隙守卫（Rift Wardens）

俯视角陷阱塔防 + 动作。6 位英雄（战法师、女术士、圣骑士、游侠、炼金术士、刃舞者，各有第二武器）、9 种陷阱 + 2 种守卫、4 个关卡（战役 / 无尽 / 每日挑战）、三档难度、关卡挑战、饰品与升级天赋，支持双人在线合作、手柄和 iPad / iPhone 触屏。

- `index.html` 是构建产物；源码、建模、图集和测试在 `src/`（见 `src/README.md`）。
- 平衡测试：`node src/test/balance.mjs <hero> [nohero] [easy,normal,nightmare]` 用脚本机器人跑全部关卡并输出每波漏怪数。
- 本地存档键：`riftwardens_v1`。
- 本游戏只由它自己的会话修改；需要通用改动请写进仓库规范（如 `IPHONE.md`）。
