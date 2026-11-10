# 完美世界OL · 开发守则

文字版网游。源码在 `src/`，`python3 build.py --deploy` 生成 `../index.html`。存档键前缀 `wanmeiol.`，联机房间前缀 `wmol-`。

| # | 规则 | 怎么保证 |
|---|------|----------|
| 1 | 剧情能从头打到尾（每一步都能完成，失败的剧情战可以重试或者回头再来，不会卡死）。 | `node test/flow.js`（CLS=0/1/2 三个职业各跑一遍） |
| 2 | 联机：跟随、共同战斗（谁发起都行）、聊天不重复、赠送、退出房间都正常。 | `node test/peerserver.js` 开着，再 `node test/coop.js` |
| 3 | 手机竖屏/横屏、iPad、电脑每个界面都放得下：没有横向滚动，按钮 ≥ 40px，战斗时技能键不出屏。 | `node test/mobile.js`，看 `/tmp/claude-0/wmol/m_*` |
| 4 | 不经用户确认不改平衡数值（`BAL`、职业成长、怪物倍率）。改之前先跑 `node test/balance.js` 出一张表。 | 改 `BAL` 前先问 |
| 5 | 剧情文字全部原创，不抄原著段落；人名地名可以用。 | 人工 |

测试服务器：`node test/serve.js out 8770`（在 src 里运行）。
