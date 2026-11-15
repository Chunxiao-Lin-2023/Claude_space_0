# 剧本杀 · 开发守则

## 结构
- `00_core.js` 状态 `G`、存档、阶段表、AI 发言预算（`AI_BUDGET`）和行动点（`AP`）
- `10_<剧本>.js` 剧本数据（每本一份）。原文放在 `text/*.txt`，构建时注入 `TEXT`
- `20_engine.js` 规则引擎：`apply(G, action, seat)` 是唯一改状态的入口；联机时只在房主上跑
- `30_ui.js` 画面与弹窗；`40_art.js` 程序绘制；`45_audio.js` 合成音效；`50_net.js` PeerJS；`90_main.js` 入口
- `python3 build.py [--deploy]` → `out/index.html`、`out/test.html`（带 `window.__dbg`）、`out/artifact.html`；`--deploy` 写 `../index.html`
- `check.js` 在构建时检查剧本数据：引用的线索/证词/话题/角色都要存在，非凶手不能有谎话，第一题答案必须是凶手

## 剧本数据怎么写（新剧本照这个格式）
- `clues`：r=1 现场（要在 `spots` 里给平面图位置），r=2 私有（`owner`）或现场深入（`scene`）
- `facts`：证词和推论。`who` 决定放在时间线板哪一列，`t` 决定哪一行；推论 id 用 `d_` 开头
- `ans[角色][话题]`：从上往下第一条 `when` 成立的；`kind` 是 truth / evade / lie / crack。**非凶手只能 truth / evade**
- `show[角色][线索]`：被出示时的反应；`brk` 打开话题（之后问他就说实话）；`_` 是默认反应
- `talk`：AI 主动发言、互相提问、互相出示，按顺序挑第一条能做的；推论类排在前面；每阶段受 `AI_BUDGET` 限制，剩下的要靠玩家自己出示证据触发
- `deck[角色]`：真人扮演时能选的说法（`vol` = 能主动说；`push` 加别人的嫌疑；`cut` 削弱某条推论；`confess` 1=认罪 2=支线失败）
- `contra`：两条一起公开 = 有人说谎被抓，指定谁来指出
- `sus`：公开后 AI 心里的嫌疑加减。AI 投票只看已公开的东西，从不读真相

## 平衡（用户确认前不改数值）
`test/solo.js` 会跑三种局并打印 AI 的嫌疑分：
- 侦探局按正常思路打 → AI 投王村长，满分
- 凶手局“消极”（总选第一个说法）→ 应该被投出
- 凶手局“聪明”（藏借条和床板、在地洞上撒谎、嫁祸张村民、反驳推论）→ 应该有机会脱身（目前 8 对 9.1，险胜）
- 无辜玩家（胡调研）照实说 → AI 应该投王村长
改 `sus`、`AI_BUDGET`、`talk` 顺序之后三条都要再看一遍。

## 界面守则（沿用 wanmeiol/src/OPTIMIZATIONS.md 的剧情类规则）
- 一次一个画面，各阶段配色不同（读本/答卷=纸、搜证=夜色青、讨论=烛光、真相=暗红）；同一画面重画不重放淡入（`body.same`）
- 说话的人用印章名牌；新消息到达自动滚到底，但用户往上翻时不打断
- 点了没反应就是 bug：不能做的按钮置灰或弹提示
- 房间码用等宽粗体
- 回游戏厅：标题左上「‹ 游戏厅」，菜单里「返回游戏厅」；联机中要点两次确认

## 测试
```
cd jubensha/src && python3 build.py
node test/serve.js out 8781 &          # 静态服务
node test/peerserver.js &              # 本地 PeerJS（联机测试用，需 npm i peer express）
node test/solo.js /tmp/jbs             # 单人三种局 + 手机竖屏 + 截图
node test/coop.js                      # 双人联机：开房/加入/选角/一起推进/提问弹窗/搜证/答卷/再来一局/掉线由 AI 接手
```
