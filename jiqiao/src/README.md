# 机巧百战 源码

- `game.html`：游戏源码（图片用 `__XXX__` 占位符）。
- `uris.json`：占位符 → WebP data URI（精灵图集、头像、图标）。
- `build.py`：`python3 build.py` 生成 `../index.html`（部署版，带 doctype 和 iOS meta）和 `out/artifact.html`（claude.ai artifact 版，仅单人）。

改游戏只改 `game.html`，然后构建，`game.html` 和 `../index.html` 一起提交。
