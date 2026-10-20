# 十夜怪谈·叁 · 章节编写手册

每一章是 `src/chapters/NN_id.js` 里的一个 `defChapter({...})`，外面包一层 `(() => { ... })();`。
**参考实现：`chapters/_ref_mary.js.txt`（第一季第一章，不参与构建；第一季其它章节在 `nighttales/src/chapters/`，可以只读参考）**（地图、剧情、追逐、检查点、好/坏结局的写法都在里面）。

引擎文件 `src/js/*.js` 是共享的，**章节作者不要改**。需要新的道具/瓦片/人物外观，写在自己章节的
`sprites` / `tiles` / `people` 里；引擎 bug 写进最终报告，不要自己改引擎。

构建与测试（从仓库根目录）：

```bash
python3 nighttales3/src/build.py --out nighttales3/.tmp_<id>/index.html     # 构建到自己的临时目录
python3 nighttales3/src/tests/play.py <id> --page nighttales3/.tmp_<id>/index.html --shots <scratch>/shots
```

`play.py` 读 `tests/sol/<id>.py` 里的 `SOL`（自动通关步骤），无头跑完整章，必须输出 `<id> OK` 且没有 ERRORS。
截图拼起来自己看一遍（PIL），检查布局、光照、人物位置。

---

## 1. 章节对象

```js
defChapter({
  id: 'kuchisake', n: 2,                 // n 决定顺序（第几夜）
  title: '裂口女', sub: '一句话简介（选章卡片上）', origin: '日本都市传说', color: '#4a2a1a',   // 卡片底色
  icon: '@onna',                         // 选章卡片上画的人物（people 里的 key）
  amb: 'wind', floor: 'wood', wall: 'paper', dark: .7, plr: 3.2,   // 全章默认：环境声/地板/墙/黑暗度/玩家光圈(格)
  people: { me: {...}, onna: {...} },    // 人物外观，见 §4；'me' 是玩家
  items: { candy: { name: '鳖甲糖', desc: '...' } },
  notes: { n1: { title: '...', text: '...' } },   // 可收集笔记，S.note('n1') 打开并记入档案
  legend: '怪谈档案：真实来历与流变（通关后在档案和结局页显示）',
  start: { map: 'street', x: 3, y: 5, dir: 0 },
  async intro(S) { await S.card('第二夜　裂口女', '1979年6月　日本岐阜县', '……'); },   // 开场标题卡
  resume: { chase: async S => { ... } },  // S.cp('chase') 存的检查点，读档/死亡重来后会调用
  tick(S, dt) { },                       // 每帧（主机）——追逐生成、计时之类；不要在这里 await
  sprites: { myprop(g, e, t, R) { ... } },  // 自定义道具
  tiles: { mytile: { solid: false, paint(R, X, Y, opts) { ... } } },
  maps: { street: {...}, home: {...} }
});
```

## 2. 地图

```js
street: {
  amb: 'wind', dark: .8, plr: 3, wall: 'brick', floor: 'asphalt', floor2: 'sidewalk',
  rain: true, fog: .3,                 // 可选天气
  legend: { 'X': 'tile', 'Y': { t: 'grass', solid: true } },   // 本图自定义字符
  tileOpts: { carpetC: '#4a2a2a', woodC: '#6b4a2f', grassC: '#2c4428', tileC: '#cfcabb', rugC, treeC, fenceBase },
  rows: [ '##########', '##########', '#........#', ... ],   // 每行等长；墙一般上面两行（第一行墙顶、第二行墙面）
  ents: [ ... ],
  async enter(S, first) { },           // 每次进入（S.go 之后）；first = 第一次进
  step(S, x, y) { },                   // 玩家每走到一格（可返回 Promise）
  tick(S, dt) { }
}
```

默认字符：`#`墙 `.`地板(floor) `,`第二地板(floor2) ` `虚空(实心) `0`纯黑地面
`"`草 `:`柏油 `=`横向黄线 `|`纵向黄线 `-`斑马线 `_`人行道 `+`瓷砖 `w`木 `W`深木 `l`浅木 `c`地毯 `r`花毯
`t`榻榻米 `d`泥土 `u`烂泥 `~`深水(实心) `o`浅水 `s`沙 `k`石板 `x`水泥 `n`油毡(走廊) `m`金属 `b`公交地板 `R`暗红地面 `q`大理石 `g`绿瓷砖 `z`黑白格
实心：`T`树 `P`松 `h`树篱 `f`木栅栏 `e`芦苇 `L`护栏 `K`岩石 `C`柜台 `B`灌木

墙样式 `wall`：paper(壁纸) plain brick wood tile school concrete stone shoji(障子) red bus(车窗) mud metal。
下方不是墙的墙格画「墙面」（窗、门、镜子、黑板挂在这一行），其余画「墙顶」。

## 3. 实体 ents

```js
{ id: 'mirror', x: 3, y: 1, w: 1, h: 1, spr: 'mirror', solid: true,
  on: async S => {...},        // 面对它按调查键
  touch: async S => {...},     // 踩上去（非实心）
  bump: async S => {...},      // 撞上去（实心）
  to: ['hall', 3, 2, 0],       // 出口简写：实心=调查门进入，非实心=踩上就走；lock:'key'|S=>bool, lockMsg
  hidden: true, dir: 0, alpha: 1, decal: true(画在最底层), z: 1(画在最上层), ox, oy(绘制偏移像素),
  light: { r: 4, col: 'rgba(255,170,80,.2)', flick: true, dx, dy },   // 光源（半径单位：格）
  follow: false, col: '#...',  // 以及各精灵用的状态字段
}
```

- 方向：0下 1左 2右 3上。玩家面对实体所在的格子按调查键触发 `on`；非实心实体站在上面也能调查。
- 挂墙的东西（门、窗、镜子、画、黑板）放在墙面那一行，玩家从下面一格朝上调查。
- 高家具（衣柜、书架、钟、冰箱）只占一格，画的时候向上伸出。
- **会被客机看见的状态**只能用这些字段：`open covered cracked blood face on off lit full read eyes red coat flowers thread knife col text water locked flicker num`，
  或者放进 `e.s`（任意键，例如 `S.ent('x').s.lit2 = true`；自定义精灵里 `e.lit2` 就能读到）。其它自定义字段不会同步。
- 人物：`spr: '@lily'`（people 里的 key）。默认实心；鬼一般 `solid: false`。
- 内置道具精灵（`src/js/10_sprites.js` 的 SPR）：bed bedL futon table table2 lowtable chair sofa armchair desk schooldesk bookshelf wardrobe closet
  mirror(covered/cracked/blood/face:'red'|'pale') vanity sink toilet squat stall(open/num/red) bathtub(full) door(open/locked) sliding window(lit/face) curtain
  clock wallclock tv(on:'static'|true) fridge stove counter cabinet dresser shelf lamp(off) candle(off) candles plant deadplant box crate barrel sack
  note paper newspaper book key item sparkle phone payphone piano painting portrait(eyes) poster blackboard(text) locker getabako vending streetlamp(off/flicker)
  sign busstop bench busseat pole car gravestone(coat/flowers) cross well lantern stonelantern torii shrine ofrenda marigold boat dock fireplace chess statue
  anatomy(eyes) doll(thread/knife) knife scissors cup(full) salt rice thread paw candy coin flashlight match towel rope photo shoes footprints stain puddle
  handprint elevdoor(open 0..1, lit) elevpanel cushion altar incense scroll brush skin whisk basket stall2(摊位) cart stairsdown stairsup rail switch(off) linen(open) invisible
- 不在实心默认列表里的小物件（note key item coin paper 等）默认非实心。

## 4. 人物外观 people

```js
{ skin, hair, hs: 'short|long|bob|bun|twin|bald|queue(清朝辫)|messy', top, top2(领口), bottom, shoes,
  skirt, dress, coat(长外套), robe(长袍到脚), noFeet(不画脚), apron, child(小孩), ghost(下半身淡出、无腿),
  cover(头发盖住脸), redEye, mask(白口罩), slit(裂开的嘴), eye, mouth, blush,
  hat: 'qing|cap|straw|veil|scarf|hood', hatC,
  big: true(放大2倍画), key: '唯一名'(有 extra 时必填),
  extra(g, d, fr, G, R) { /* d:0正 1侧 3背；G={hT,tT,tB,lT,lB}；R(x,y,w,h,col) 额外画几笔 */ } }
```
16×24 像素，脚底在格子底边；侧面朝左，朝右自动镜像。

## 5. 剧本 API（S）

所有剧本都是 `async S => {...}`，**一次只跑一段**（跑的时候玩家不能动）。

| 调用 | 说明 |
|---|---|
| `await S.say(谁, 文本或[多页], {style})` | 对话框。style: `think` 内心、`whisper` 低语、`big` 大红字 |
| `await S.narr(文本)` / `S.think(文本)` | 旁白 / 内心 |
| `await S.ask(问题, [选项…], 谁)` → 序号 | 选项 |
| `await S.card(标题, 副标题, 正文)` | 全屏标题卡（章节开头、时间跳跃） |
| `await S.note('id')` | 打开笔记并记入档案 |
| `await S.keypad(提示, ['1','2',…], 位数)` → 字符串或 null | 密码盘/按钮面板 |
| `await S.wait(ms)` `await S.fade(1|0, ms)` | 等待 / 渐黑渐亮 |
| `await S.go(map, x, y, dir)` | 切地图（自动渐变，会运行目标图 enter） |
| `S.give(id)` `S.take(id)` `S.has(id)` | 物品 |
| `S.f` | 本章旗标对象（随检查点保存）。`S.once('key')` 第一次返回 true |
| `S.goal(文本)` | 右上角目标 |
| `S.toast(文本)` | 小提示 |
| `S.ent(id)` `S.show(id)` `S.hide(id)` `S.place(id,x,y,dir)` `S.moveTo(id, map, x, y, dir)` | 实体 |
| `await S.walk(id\|'pl', 'uulr'\|[x,y]\|[[x,y],…], 速度)` | NPC/玩家走路（目标格自动寻路） |
| `S.face(id\|'pl', 方向\|'pl'\|实体id)` `S.turn(dir)` `S.pos(x,y,dir)` | 朝向 / 玩家瞬移 |
| `S.bubble(id\|'pl', '!'\|'?'\|'…'\|'♥', ms)` | 头顶气泡 |
| `S.chase(id, {spd, catch: async S=>{}, always, wander, zone:(x,y)=>bool})` `S.stop(id)` | 追逐（默认被抓 = `S.die`） |
| `S.follow(id, true)` | 跟随玩家 |
| `await S.scare('face'\|'flash'\|'red'\|'static'\|'glitch'\|'blood', {spr:'@ghost', sfx, dur})` | 惊吓（含音效和震动） |
| `S.fx(kind)` `S.shake(ms, 强度)` `S.sfx(名)` `S.amb(名)` | 特效 / 音效 / 环境声 |
| `S.dark(v)` `S.plr(格)` | 当前地图黑暗度（0~1，null 恢复） / 玩家光圈半径（null 恢复） |
| `await S.alpha(id, 0~1, ms)` | 实体淡入淡出 |
| `await S.bells(n, 间隔, 'bell')` | 连续钟声 |
| `S.tile(x, y, 字符, map)` | 改地图格子 |
| `S.timer(秒, 标签, async S=>{})` `S.clearTimer()` | 倒计时（显示在左上） |
| `S.after(ms, async S=>{})` | 空闲时延后运行一段剧本 |
| `S.focus(x, y)` / `S.focus(null)` | 镜头对准某格 |
| `S.norun(true)` | 禁止奔跑（潜行段），`S.norun(false)` 恢复 |
| `S.hidePlayer(true)` `S.wear('@wife'\|'car')` `S.speed(倍)` | 玩家隐藏（躲藏时追逐者会乱逛）/换外观/速度 |
| `S.cp(名)` | 存检查点（死亡后从这里重来；名字对应 `resume`） |
| `await S.die(文本, 标题)` | 死亡 → 从检查点重来 |
| `await S.end({title, text})` / `S.end({bad:true, title, text})` | 好结局（解锁档案）/ 坏结局（可重来） |

音效 `S.sfx`：step blip select item paper open close locked knock switch match scare sting heart whisper bell ding glass scream thud cry tv giggle drip water splash phone tick car brake tear chime good bad laugh chant cut。
环境声 `S.amb` / 地图 `amb`：drone room wind rain bus car river night tv elevator otherworld school fire market none。

## 6. 写作要求

- 中文。台词口语、短句、有画面感；恐怖靠氛围、细节和节奏，少用直白的血腥描写。
- 每章 15–25 分钟：3–5 张地图，至少一个谜题、一段危险（追逐/躲藏/限时）、3–4 张可收集笔记（交代背景）、
  一个好结局（`S.end`），最好再有一个坏结局（`S.end({bad:true})`）。
- 「把整个故事探索出来」：传说的关键元素（起源、规则、禁忌、破解法、流传的版本差异）都要在游戏里被看到/听到/读到。
- 必须有清晰的目标提示（`S.goal`），卡关点要有 NPC 或物品给提示。每个可调查物都有一句有味道的描述。
- 检查点：开场剧情后自动存一次；每个危险段落开始前 `S.cp('名')`，并在 `resume` 里把追逐者复位。
- 死亡不要太频繁；追逐者速度 2.6–3.2（玩家走 4.2 / 跑 6.8 格每秒）。
- `legend`：用自己的话写真实的来历与流变（3–4 段），不确定的说法用「据说」「有一种说法」；结尾注明哪些是游戏虚构。
  不要提真实的遇难者姓名。
- 选章卡片图标 `icon` 和颜色 `color` 要能一眼认出这一章。

## 7. 已知坑（写作时注意）

- `S.timer` 按真实时间走，不受测试的 `fast` 参数影响；SOL 里等计时器会多花真实时间。
- 内置 `fireplace` 精灵永远有火，`off` 不生效；要熄火的壁炉自己写精灵。
- `S.moveTo` 把实体搬到另一张地图后，读档时找不回它。跨地图的 NPC 每张图各放一个，用 `S.show`/`S.hide` 切换。
