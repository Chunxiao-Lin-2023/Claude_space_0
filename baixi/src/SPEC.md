# 百戏茶馆 — game module spec

One page (`baixi/index.html`) holds a lobby and ~59 games. Each game is **one file** `src/games/<id>.js` that calls
`BX.register({...})`. `build.py` concatenates core + all games (each wrapped in its own function scope + try/catch).
Read the two reference games first: `games/gomoku.js` (turn) and `games/airhockey.js` (realtime).

## Hard rules
- Only create/edit **your own** `src/games/<id>.js` files (helpers private to you may go in the same file; a shared
  data file for several of your games may be `src/games/_<yourprefix>_data.js`, defining `BX.data.<name>` — files
  starting with `_` load before games). Never edit `core/`, `build.py`, `test/`, other games, or anything outside `src/games/`.
  Need a framework feature? Work around it inside your file and mention it in your final report.
- Do not `git commit`/`push` — the integrator does that.
- No external assets (no image/audio files, no CDN). Draw everything with Canvas 2D (or DOM/CSS). Sounds: `ctx.sfx(name)`.
- All UI text in **Simplified Chinese**. Rules = the **most classic/standard** version of the game, written in `rules` (HTML, Chinese).
  Original names/art only — no trademarked names or characters (e.g. UNO → 彩牌接龙, Monopoly → 地产大亨).
- Must work on desktop (mouse+keyboard), iPad and iPhone (touch, portrait 393×852 **and** landscape 852×393;
  the top bar takes 52px, 44px on landscape phones). Never rely on hover; tap targets ≥ 40px; lay out by aspect ratio.
- `'use strict'` is on. Your file's top-level `const`s are private (the build wraps each file in a function).

## Registration
```js
BX.register({
  id: 'xiangqi', title: '中国象棋', cat: 'classic', order: 1,      // cat ∈ classic heavy cards party dice brain arcade social physics sports deduce speed words folk coop solo
  sub: '一句话简介 (≤12字)', desc: '两三句介绍（大厅卡片/详情页）',
  kind: 'turn' | 'realtime' | 'solo',
  seats: 2 | [min, max],          // total players including AI.   defSeats: default count when a range
  modes: ['ai','local','online'], // subset; default all three. solo kind → single player
  seatNames: ['红方','黑方'],      // labels used for local hot-seat players (optional)
  seatColors: ['#c23a2b', '#222'],// optional chip colours
  hidden: true,                   // hot-seat must hand the device over between players (cards, ships, secret codes…)
  coop: true,                     // cooperative game: end with ctx.end({win:true|false})
  firstLabel: '执子', noFirst: true, aiLevels: false, undo: false, resume: false, aiDelay: 420,
  options: [{key: 'size', label: '棋盘', choices: [[9, '9路'], [19, '19路']], def: 19, modes?: ['ai']}],
  rules: '<p>…</p>',
  icon(g, w, h) { /* draw a small picture of the game on a 200×150 canvas (real mini-illustration, not just a letter) */ },
  create(ctx) { return instance; },
});
```

## Turn games (`kind:'turn'`) — deterministic lock-step
The whole match is a seed + an action log. Host and guest (and undo / resume) rebuild state by replaying the log, so:
- Keep **all** game state in a JSON-serializable object exposed as `inst.st` (tests compare it host vs guest and after replay).
- Change state **only** inside `apply(a, by)`. UI never mutates `st`; it calls `ctx.act(action, seat)`.
- Randomness **only** from `ctx.rng()` (also `ctx.rng.int(n)`, `.pick(arr)`, `.shuffle(arr)`), only inside `create`/`apply`.
  `Math.random` is fine in `aiMove`, visuals and sound. Never read time/clock in apply.
- Physics inside `apply` (billiards, curling…): use only `+ - * /`, `Math.sqrt`, `Math.abs`, `Math.min/max`, comparisons.
  **No** `Math.sin/cos/atan2/exp/pow(non-int)/hypot` in apply (engines may differ in last bits → host/guest desync). Put the
  shot direction as a unit vector `{dx,dy}` (computed in the UI/AI) inside the action. Fixed timestep, bounded iteration count.
- `ctx.act` may return before the action is applied (online guest → host round trip). Gate input with `ctx.canAct(seat)`.

Instance methods:
| method | |
|---|---|
| `st` | the state object (required) |
| `apply(a, by)` | apply one action by seat `by` (`-1` = system). Call `ctx.end({...})` here when the game is over. |
| `toMove()` | seat (or array of seats for simultaneous choices) that must act now; `null` when over or waiting for an animation/system step |
| `aiMove(seat, level)` | return the action for an AI seat (may be `async`); level 1 初级 / 2 中级 / 3 高级. ≤ 800 ms per call. Must always return a legal action (tests run AI-vs-AI to the end). Don't peek at hidden info at level 1–2; level 3 may estimate. |
| `sysMove()` | optional: `{a, delay}` → host performs action `a` as seat -1 after `delay` ms (e.g. flip cards back, deal next hand, resolve a battle after a pause). Re-evaluated after every action, replay-safe. |
| `valid(a, by)` | optional host-side check of a guest's action (with `anyTimeActs: true` in the def the host skips its own whose-turn check and relies on `valid`) |
| `onTurn(seats)` | optional: called after every action once `ctx.turn` is updated — update `ctx.status()` here |
| `onView(seat)` | optional: hot-seat perspective changed (`ctx.view`) |
| `frame(dt)` | draw (called every animation frame) |
| `resize(w,h)`, `key(e)`, `onMsg(m, by)`, `ready()`, `destroy()` | optional |

Simultaneous secret choices (猜拳, 点球, 海战布阵): `toMove()` returns all seats still to choose; each seat's choice is its own action;
reveal only when all are in (store choices in `st` but don't draw opponents' until revealed).
Hidden info: render from `ctx.view`'s perspective (in hot-seat the framework shows a hand-over screen and changes `ctx.view`).
In AI / online modes `ctx.view === ctx.me` (the local human seat).

## Realtime games (`kind:'realtime'`) — host authoritative
Host (and offline) runs `step(dt, inputs)` at fixed 60 Hz; guest only renders `restore(snapshot)` (20 Hz) and sends its input (30 Hz).
| method | |
|---|---|
| `st` | state (recommended) |
| `input(seat, slot, nLocal)` | read *this device's* controls for local seat → small plain object. `nLocal` = local humans on this device (2 = same-screen: split keyboard WASD/方向键 and split touch areas, `slot` = 0/1). |
| `aiInput(seat, level)` | same shape as `input`, produced by AI (also used to play local seats in tests) |
| `step(dt, inputs)` | host simulation; `inputs[seat]`. Call `ctx.end({winner})` when over. Math.random OK here (host only). |
| `snapshot()` / `restore(d)` | compact JSON (keep < 6 KB: round numbers, arrays). Put one-shot events (sounds, effects) in a small rolling `ev` list with increasing ids so the guest can play them once. |
| `draw(dt)` | render every frame (host and guest) |
| `onPause(p)` | optional |
Seats' own perspective: in single-local-player views, flip/rotate so the local player's side is at the bottom/left (see airhockey `view()`).

## Solo games (`kind:'solo'`)
`create` + `frame(dt)` (+ `key(e)`); end with `ctx.end({win: true|false, text, title?})`. Use `ctx.best(key, value, 'max'|'min')`
for records and `ctx.save/load` for progress. Offer difficulty/variant via `options`. Provide a "新局/提示" control where it makes sense.

## ctx reference
`ctx.mode` ('ai'|'local'|'online'|'solo') · `ctx.opts` · `ctx.n` seats · `ctx.seats[i] = {i,name,ctrl:'local'|'ai'|'remote',level,color}` ·
`ctx.isHost` · `ctx.online` · `ctx.hotseat` · `ctx.mySeats` · `ctx.me` · `ctx.view` · `ctx.turn` (array) ·
`ctx.isLocal(s) / isAI(s) / isRemote(s) / name(s) / color(s) / level(s) / canAct(s)` ·
`ctx.act(a, by)` · `ctx.end({winner: seat | [seats] | -1 (draw), text, win, title, html, delay})` · `ctx.ended` ·
`ctx.status(html)` (top bar line) · `ctx.info(seat, text)` (score next to a player's name chip) ·
`ctx.canvas({parent, maxDpr})` → `{cv, g, w, h, dpr, pos(e), clear(color)}` — auto-resizes; call `c.clear()` at the start of each frame and use `c.w/c.h` (CSS px) ·
`ctx.ui(cls)` → DOM overlay div above the canvas for buttons/panels (classes `bx-btn` (`red`,`jade`,`ghost`), `bx-bar` bottom bar, `bx-panel`) ·
`ctx.on(target, type, fn)` (auto-removed) · `ctx.keys` (Set of `e.code`) · `ctx.anim(ms, fn(k), done, ease)` (visual tween; instant during replay) ·
`ctx.after(ms, fn)` / `ctx.cancel(t)` (visual-only timer) · `ctx.sfx(name)` · `ctx.toast(msg)` · `ctx.fast` (true while replaying — skip effects) ·
`ctx.poke()` (re-check toMove/AI after an animation finished) · `ctx.send(m)` + `inst.onMsg(m,by)` (ephemeral online messages, e.g. drawing strokes; not part of state) ·
`ctx.save(k,v)/load(k,d)` · `ctx.best(k,v,dir)` · `BX.modal / BX.choose / BX.confirm / BX.toast` (promise-based dialogs — don't use them to gate state for bots; bots act only through `aiMove`).

Sounds: click select place stone move capture card deal shuffle flip dice coin chip tick bell whoosh hit bounce pop buzz error score start win lose draw your gong splash crash boom roll swish pen.

Helpers: `BX.draw` — `rr, circle, text(g,s,x,y,{size,color,font:'serif'|'sans'|'deco',weight,align,stroke,shadow}), wood, paper, felt, disc, stone, piece (象棋式圆木子), card(g,x,y,w,h,{r:1..13,s:0..3}|{joker:'big'|'small'}|null,{sel,dim,mini}), die(g,x,y,size,face,{rot,sel,color}), iconBase, glyphIcon, grid, hint, shade, alpha`;
`BX.C` palette, `BX.F` fonts, `BX.fit(W,H,w,h,pad)`, `BX.ease`, `BX.clamp/lerp/range/shuffle/pick/clone`, `BX.rng(seed)`;
`BX.ai.negamax({state,depth,timeMs,moves,play,unplay?,evaluate,terminal?,order?})`, `BX.ai.mcts({...})`, `BX.ai.byLevel(scored, level)`.

## Look & feel (国风茶馆)
Warm wood tables, rice paper, ink, vermilion seals, jade and gold accents (`BX.C`). Boards centered with `BX.fit`, pieces with soft shadows,
short tweened animations for moves/deals/rolls, clear highlight of last move / legal moves / whose turn, readable at phone size.
Status line via `ctx.status`, scores via `ctx.info`. Show a brief in-game hint for controls when not obvious.

## Testing (required — every game must PASS)
```
bash test/t.sh --games id1,id2 [--phone] [--online] [--time 60]     # Bash tool timeout: 600000
```
Runs AI-vs-AI games (local human seats are played by your `aiMove`/`aiInput`) on desktop/iPad (+ phones with `--phone`),
checks for page errors, that turn games end, replay determinism, and with `--online` a 2-client game through a local PeerJS server
(state must be identical on both). Screenshots go to `/home/claude/bxtools/shots/<id>/`; build a contact sheet with
`python3 /home/claude/bxtools/montage.py <out.png> <png...>` and **look at it** (Read tool) to judge layout and polish at desktop and phone sizes.
Tests share 2 CPUs with other sessions; t.sh queues automatically — run focused tests, not the whole suite.
Quick manual peek: `python3 build.py --only <ids> --out /tmp/x.html` then Playwright, or `?game=<id>&mode=ai` deep link.

## v1.1 additions — player prefs, hints, first-play guide, reconnect
- `howto: ['…', '…']` in the def — 2–5 short Chinese lines (HTML ok) explaining the **controls** (tap/drag/keys, what the buttons do).
  Shown once automatically the first time a player opens the game, and at the top of the 规则 dialog. Every game must have one.
- Hint button 💡 (top bar, ai/local modes only) appears automatically when the instance has either
  - `showHint(action, seat)` (turn games with `aiMove`): the framework calls `aiMove(seat, 3)` for the local player and passes the result;
    draw a clear pulsing highlight of that move (source + target), clear it when state changes. Never apply it.
  - or `hint()` — the game does everything itself (solo puzzles, realtime games, complex multi-step turns).
  Def `hint: false` hides it (e.g. games where a hint is meaningless).
- `ctx.needConfirm(e)` — true when this tap should only preview and a second tap on the same target confirms (player pref 落子确认:
  default = touch only). Use it instead of checking `pointerType` yourself, for every irreversible placement/move where mis-taps are likely.
- `ctx.pref('hints')` — boolean, show legal-move / playable-card markers. Default true. Respect it (when false, still show selection + last move).
- `ctx.pref('speed')` — 1 normal / 2 fast. `ctx.anim`, `ctx.after`, sysMove delays and AI think delay are already scaled; read it only for
  timings you do yourself (e.g. your own frame-based tweens or dealing sequences).
- `ctx.buzz(ms)` — light haptic (phones that support it); use sparingly: illegal move, being captured/hit, your win.
- Top bar is now `‹ 大厅 · seats/status · ↶ 💡 ❚❚ ☺ ⋯`; the ⋯ menu holds 规则 / 重开 / 声音 / prefs. Don't duplicate these inside the game UI.
- Online: a guest whose link drops auto-reconnects; meanwhile its seat is played by the AI and handed back on return (turn games resend the
  action log; realtime games get fresh snapshots — so `restore(d)` must rebuild everything visible from one snapshot).
- Test a dropped link: `bash test/t.sh --games <id> --online --rejoin`.

## v1.2 additions — game feel
- `ctx.alpha` (realtime, host/offline): fraction 0..1 of the next fixed 60 Hz step already elapsed. Store previous positions in `step` and
  draw `lerp(prev, cur, ctx.alpha)` so motion is smooth on 90/120 Hz displays (otherwise objects judder at 60 Hz steps).
- `ctx.points(e, cv.cv)` → all sub-frame samples of a pointer event (`getCoalescedEvents`) as `[{x, y, t}]` — use for drag smoothing and
  swipe velocity instead of a single sample per frame.
- Def `snapHz` (default 20, max sensible 30) and `inputHz` (default 30, max 60) — raise for fast twitchy games if the snapshot stays small
  (< ~2 KB). Guests should still interpolate/extrapolate between snapshots.
