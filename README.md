# 游戏厅

网址：https://chunxiao-lin-2023.github.io/Claude_space_0/

| 游戏 | 文件夹 | 状态 |
| --- | --- | --- |
| 机巧百战 | `jiqiao/` | 已完成 |
| 云岛冒险 | `cloudisle/` | 开发中 |
| 裂隙守卫 | `riftwardens/` | 开发中 |

## 规则（保证一个游戏的维护不影响别的）

- 每个游戏只住在自己的文件夹里，是一个自包含的 `index.html`，不引用其他文件夹的任何文件。
- 改某个游戏时，只改它自己的文件夹。提交前 `git diff --stat` 确认没有碰到别的文件夹；游戏自己的说明写在 `<文件夹>/README.md`。
- 根目录只有大厅：`index.html`、`games.js`、`covers/`、`README.md`、`.nojekyll`。大厅只放链接，不含游戏代码。
- 每个游戏的本地存储键都带自己的前缀（`jqbz-`、`cloudisle.`、`riftwardens_`），大厅用 `hub.`，互不覆盖。
- 多个会话同时改这个仓库时，推送前先 `git pull --rebase`。

## 加一个新游戏

1. 新建文件夹 `<名字>/index.html`（可选 `<名字>/README.md`）。
2. 在 `games.js` 里加一项（`status`: `done` 已完成 / `dev` 开发中）。
3. 在 `covers/` 放一张 16:9 封面（800×450 WebP）。
