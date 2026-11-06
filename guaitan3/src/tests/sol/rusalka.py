# 第十九夜 水仙女 · 自动通关步骤（格式见 tests/play.py 顶部）
# 主线：读练习本 → 认草（先错一次 15，再答 73）→ 村子：奥克萨娜、加莉娅（歌）、白桦取花环、玛尔法（拒）→ 信匣 → 玛尔法给衬衣
#       → 黑麦田：捡帽子、问答答「苦艾」→ 河滩：真人速度躲歌声 → 老白桦：挂衬衣（好结局「送她过节」）
D = 'window.__dbg'

# 真人速度过河滩：安静时按住「右」（右边被黑麦挡住就往下绕）；歌声前的预警/歌声里按住「上」（贴着木桩时可以不动）；对话一律翻页
MEADOW = ("(async () => { const D = window.__dbg, sl = ms => new Promise(r => setTimeout(r, ms)), t0 = performance.now();"
          " IN.stack = [2];"
          " while (performance.now() - t0 < 60000) { const w = D.W; if (!w || w.endScreen || w.f.phase !== 'meadow') break;"
          "  if (w.dlg || w.card || w.note || w.busy) { IN.stack = []; await window.__auto([], 400); continue; }"
          "  const ss = w.f._ss, p = w.pl, m = w.maps.bereg, fr = passable(m, p.x + 1, p.y, p);"
          "  IN.stack = (ss === 'song' || ss === 'warn') ? [3] : fr ? [2] : [0];"
          "  await sl(16); }"
          " IN.stack = []; })()")

SOL = [
    [],
    ['shot', 'izba'],
    ['expect', f"{D}.W.f.phase === 'herb' && {D}.store.get('notes', []).includes('rusalka:rules')"],
    ['use', 'babka'],
    ['use', 'tbl'],
    ['expect', f"{D}.W.f.readHerbs"],
    ['use', 'b3'], ['use', 'b5'], ['use', 'b2'],
    # 答错一次：1 号和 5 号
    ['use', 'babka', ['15']],
    ['expect', f"{D}.W.f.wrong === 1 && {D}.W.f.phase === 'herb'"],
    ['use', 'babka', ['73']],
    ['expect', f"{D}.W.inv.includes('polyn') && {D}.W.f.phase === 'out' && !{D}.ent('polynD').hidden"],
    ['step', 4, 7],
    ['expect', f"{D}.W.mapId === 'selo'"],
    ['shot', 'selo'],
    ['use', 'oksana'], ['use', 'galya'],
    ['expect', f"{D}.store.get('notes', []).includes('rusalka:song')"],
    ['use', 'birchV', [0]],
    ['expect', f"{D}.W.inv.includes('venok')"],
    ['use', 'marfa'],
    ['expect', f"{D}.W.f.marfaNo && !{D}.W.inv.includes('sorochka')"],
    ['use', 'casket'],
    ['use', 'marfa', [0]],
    ['expect', f"{D}.W.inv.includes('sorochka') && {D}.W.f.marfaMsg"],
    ['use', 'well'], ['use', 'cross'], ['use', 'straw'],
    ['step', 17, 20],
    ['expect', f"{D}.W.mapId === 'rozh' && {D}.W.f.phase === 'rye'"],
    ['use', 'cap'],
    ['use', 'vasil'],
    ['step', 9, 10],
    ['shot', 'rye'],
    # 问答：先不说话一次，再答苦艾
    ['step', 13, 17, [2, 0]],
    ['expect', f"{D}.W.f.met && {D}.ent('rus_r').hidden && !{D}.W.endScreen"],
    ['step', 11, 27],
    ['expect', f"{D}.W.mapId === 'bereg' && {D}.W.f.phase === 'meadow' && {D}.W.noRun"],
    ['shot', 'meadow'],
    ['js', MEADOW],
    ['wait', 200],
    ['expect', f"{D}.W.f.phase === 'birch' && !{D}.W.f.wet"],
    ['shot', 'birch'],
    ['use', 'stepan'],
    ['use', 'oldbirch', [1]],
    ['expect', f"{D}.W.f._o_alyTalk"],
    ['use', 'oldbirch', [0]],
]
