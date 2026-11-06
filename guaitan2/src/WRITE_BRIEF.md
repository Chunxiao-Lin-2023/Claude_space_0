# 写一章：作者须知

每章由一个作者负责。游戏文件夹记作 `<game>`（`guaitan2` 或 `guaitan3`），章节 id 记作 `<id>`，夜数记作 `NN`（两位数）。

## 范围
只写这两个文件：
- `<game>/src/chapters/NN_<id>.js`
- `<game>/src/tests/sol/<id>.py`

引擎（`src/js/*`）、`shell.html`、`build.py`、别的章节、别的游戏文件夹都不改，不做任何 git 操作。需要引擎支持时写进最终汇报，章节里先用现有 API 做到最好。

## 开工前必读
1. `<game>/src/AUTHORING.md`（章节写法、剧本 API、§7 已知坑）——严格遵守。
2. `<game>/src/PLAN.md` 里你这一章的策划和「通用约束」。
3. 参考《怪谈·壹》已经优化过的章节（只读）：`nighttales/src/chapters/*.js` 和 `nighttales/src/tests/sol/*.py`。看两三章学规模和手法（每章 60–100 KB）。
4. 参考上一轮的审查清单 `nighttales/src/reviews/*.md`（20 份，每份 20 条）：里面的常见问题（谜题能瞎蒙、追逐输不了、检查点状态不复位、客机不同步、调查不到的实体、目标提示不清……）这一章写的时候就要避免。

## 质量要求
- 规模：15–25 分钟，3–5 张地图，至少一个谜题、一段危险、3–4 张笔记、legend 3–4 段（结尾注明哪些是游戏虚构）。
- 一开始就做到：`endings` 结局收集（每个 `S.end` 带 `id`）、好结局 + 至少一个坏结局（第三结局或隐藏细节更好）、主要的鬼至少一张 `faces` 惊吓大头像、关键音效用 `S.tone` 合成、谜题逐级提示、关键抉择用 `S.vote`（写出两人意见不一致的分支）、危险段按真人速度调到能赢也能输、每个危险段前有检查点且死后重来状态完整复位。
- 剧本给实体设的状态字段必须在 VKEYS 里或放进 `e.s`；客机上实体没有 `mv`，判断走动读 `e.fr`；判断玩家走动用 `S.moving`。
- 中文台词，口语自然、有画面感；氛围优先，惊吓少而准。传说要素完整呈现；对当地文化与信仰保持尊重。
- 每个可调查物都有一句有味道的描述；目标提示 `S.goal` 始终清楚。
- 选章卡片图标（`icon` 或 `thumb`）一眼能认出这一章。

## 构建与测试（仓库根目录）
```bash
python3 <game>/src/build.py --out <game>/.tmp_<id>/index.html --only <id>
PYTHONDONTWRITEBYTECODE=1 python3 <game>/src/tests/play.py <id> --page <game>/.tmp_<id>/index.html --shots <scratchpad>/w_<id>
```
- 必须输出 `<id> OK`，没有 ERRORS，没有 REACH WARNINGS（NPC 正在走路造成的暂时阻挡除外）。
- 用 SOL 变体（放 scratchpad，不进仓库）验证每个坏结局、每种死亡和重来；危险段写一个按真人速度移动的脚本试一次。
- 截图拼成总览图看一遍（布局、光照、人物位置、文字溢出、iPad 竖屏）。
- 机器只有 2 核、多人并行：同一时间只开一个 Chromium，跑完立刻结束；不要用 `pkill -f`；分段写文件、及时落盘；临时文件只写到 scratchpad。
- 完成后删除 `<game>/.tmp_<id>/`。

## 汇报（10 行以内）
梗概 3 行、地图列表、谜题答案、结局列表与坏结局触发方式、测试结果、需要引擎支持的事项（如果有）。
