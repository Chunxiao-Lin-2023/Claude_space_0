# 游戏厅

网址：https://chunxiao-lin-2023.github.io/Claude_space_0/

| 游戏 | 文件夹 | 状态 |
| --- | --- | --- |
| 机巧百战 | `jiqiao/` | 已完成 |
| 云岛冒险 | `cloudisle/` | 开发中 |
| 裂隙守卫 | `riftwardens/` | 开发中 |
| 沙丘乱斗 | `dunerumble/` | 开发中 |
| 猫猫咕咕的家 | `pawpals/` | 开发中 |
| 幽宅双影 | `hollowmanor/` | 开发中 |
| 十夜怪谈 | `nighttales/` | 开发中 |
| 尸夜孤楼 | `lasttower/` | 开发中 |
| 尸潮堡垒 | `deadtide/` | 开发中 |
| 百戏茶馆 | `baixi/` | 开发中 |

## 规则（保证一个游戏的维护不影响别的）

- 每个游戏只住在自己的文件夹里，是一个自包含的 `index.html`，不引用其他文件夹的任何文件。
- 改某个游戏时，只改它自己的文件夹。提交前 `git diff --stat` 确认没有碰到别的文件夹；游戏自己的说明写在 `<文件夹>/README.md`。
- 根目录只有大厅和通用规范：`index.html`、`games.js`、`covers/`、`README.md`、`IPHONE.md`、`.nojekyll`。大厅只放链接，不含游戏代码。
- 每个游戏的本地存储键都带自己的前缀（`jqbz-`、`cloudisle.`、`riftwardens_`、`dunerumble.`、`pawpals.`、`hollowmanor.`、`nighttales.`、`lasttower.`、`deadtide.`、`baixi.`），大厅用 `hub.`，互不覆盖。
- **一个游戏只由它自己的会话修改。** 别的会话需要改它（比如加通用功能）时，写成规范放进仓库（如 `IPHONE.md`），由该游戏的会话在自己的源码里实现，不直接改别人的文件。
- **源码进仓库**：每个游戏的源码和构建脚本放在 `<文件夹>/src/`，`index.html` 只是构建产物。开工前先 `git pull --rebase`，从源码构建一次确认和仓库里的 `index.html` 一致；不一致说明有人直接改过产物，先把那些改动合进源码。
- 多个会话同时改这个仓库时，推送前先 `git pull --rebase`。
- 通用适配规范：[`IPHONE.md`](IPHONE.md)（iPhone 竖屏 / 横屏）。

## 加一个新游戏

1. 新建文件夹 `<名字>/index.html`（可选 `<名字>/README.md`）。
2. 在 `games.js` 里加一项（`status`: `done` 已完成 / `dev` 开发中）。
3. 在 `covers/` 放一张 16:9 封面（800×450 WebP）。
