# TitleKit — one start screen for every game in the hub

Every game in this repo (and every game inside 百戏茶馆) opens on the same start screen. Each game keeps its own
backdrop, title lettering and accent colour; the structure, wording, buttons, rooms, saves and settings are identical.

**Source of truth:** `shared/titlekit/titlekit.js` + `titlekit.css`. Games stay self-contained: each one vendors a copy
into `<game>/src/vendor/` (riftwardens: `src/game/vendor/`) and its `build.py` inlines it. After changing the kit:

```
python3 shared/titlekit/sync.py      # copies the kit into every game that has src/vendor/titlekit.js
# then rebuild those games (each game's own build.py)
```

## Layout

```
‹ 游戏厅                                   🔊  ？  ⚙        ← top bar (hub link only in the hub build)
                 GAME TITLE  (the game's own font / art)
                 subtitle
          ┌──────────────────────────────┐
          │ ▶ 继续          newest save · time │  ← only when a save exists (primary)
          │ ▶ 新游戏 / 单人   ›             │  ← opens 开局设置 if the game has options
          │ 👥 双人同屏      ›              │  ← local multiplayer (if any)
          │ 🌐 联机          ›              │  ← 创建房间 / 加入房间
          │ 💾 存档          N 个位置 · 已用 n │
          │ 🏆 记录          best result    │
          │   (game extras, e.g. 怪谈档案)  │
          └──────────────────────────────┘
```

Second-level screens (all with ‹ 返回, Esc also goes back):

| screen | what it holds |
|---|---|
| 开局设置 | game-specific options declared as fields: `seg` (segmented), `cards`, `toggle`, `text`, `note`, or `node` (a game-owned DOM block, e.g. a hero picker) |
| 联机 | 昵称 (shared across the hub as `hub.nick`), 创建房间, 加入房间 (4-char code, auto-uppercase, last code remembered), optional fields (e.g. which character joins) |
| 房间 | big room code, 复制房间码, 复制邀请链接 (`…/game/?room=CODE` opens 联机 with the code filled), player list with ready tags, room options (host edits, guest sees “房主决定”), ready / start / custom actions, leave |
| 存档 | slots with title, detail and “今天 21:14”-style time; 读取, 导出 (save code + download), 删除 (tap twice), 导入 (paste or file), 新建 in empty slots |
| 设置 | grouped rows: toggles, segmented choices, sliders, buttons |
| 玩法 | the game's rules / controls |
| 记录 | stat tiles |

Games whose second level is too rich for fields keep their own screen there (riftwardens level select, jiqiao hero page,
jubensha setup + lobby, 百物语 chapter grid, 云岛冒险 character creation) and get a ‹ 返回 back to the kit.

Keyboard: ↑↓ / W S move, Enter activates, Esc goes back. Touch: 44–52 px targets, safe areas, menus scroll even when the
game blocks touchmove. Phones in portrait put the menu at the bottom; short landscape screens put the title on the left.

## API (short)

```js
const TK = TitleKit.create({
  id, title, logo /* html or node */, hub, hubLabel, onHub, artifact,
  theme: 'dark'|'light', accent, accentInk, font, panel, bg, blur, z, hidden, shade,
  solo: {label, sub, chev} | false,  local: {...} | false,
  online: {label, sub, hostText, joinText, nick:false, fields} | false,
  setup: {title, fields: [...] | () => [...], start, hostStart, wide},
  saves: {label, slots, list(), load(slot), remove, export, import, newInSlot, continue, menu, note},
  records, recordsSub, extra: [{id, label, sub, icon, run(T)}], settings: [...], howto, foot, version,
  nick: {get, set}, sound: {get, set}, sfx,
  start({mode, setup}), host({setup, nick}), join({code, nick, setup}),
  leaveRoom(), roomReady(v), roomStart(), roomSet(key, v), roomAction(id), onShow, onHide, onScreen
});
TK.show(screen?) · TK.hide() · TK.home() · TK.go(screen) · TK.startMode(mode) · TK.refresh() · TK.toast(msg)
TK.room({code, host, players:[{name, sub, me, tag, ok, color} | {empty:true, name}], fields, values,
         status, error, readyBtn, ready, startBtn, canStart, startLabel, actions:[{id,label}], node, wide})
TK.room(null) · TK.roomFail(msg) · TK.park(node) · TK.setup · TK.screen · TK.visible
```

The adapter in each game (`85_title.js`, `89_title.js`, `title_adapter.js` …) maps these callbacks onto the game's
existing functions and hides the old title / lobby DOM, which stays in the page so the rest of the code keeps working.
