# 第五夜 复活玛丽 · 自动通关步骤（格式见 tests/play.py 顶部）
# 主线：舞厅里调查一圈 → 跟玛丽跳狐步、华尔兹 → 开车送她 → 公墓门口停车、待在车里 → 拿手包 → 酒馆听规矩
#       → 沿阿彻大道走回舞厅（真实时间躲那辆车）→ 乔 → 点唱机先按错一次（418）再按对（438）→ 最后一支舞 → 「最后一支舞」结局
D = 'window.__dbg'

# 跳舞：每一步在拍子前 0.1 秒踩上脚印（tick 按真实时间走，不受 fast 加速）
DANCE = ("(async () => { const D = window.__dbg, sl = ms => new Promise(r => setTimeout(r, ms)), t0 = performance.now(); let seen = false;"
         " while (performance.now() - t0 < 80000) { const W = D.W, d = W && W._dn; if (!d || d.over) { if (seen) break; await sl(40); continue; } seen = true;"
         " if (d.tgt && d.res == null && !W.busy && W.t - d.t0 >= d.T - 0.1) D.tp(d.tgt[0], d.tgt[1]); await sl(12); } })()")

# 走回舞厅：按真人步速（走 240ms/格、跑 150ms/格）在路肩上往西走；车没来就走，车来了就往最近的光圈里跑
WALK = ("(async () => { const D = window.__dbg, sl = ms => new Promise(r => setTimeout(r, ms)), t0 = performance.now();"
        " const LAMPS = [17, 33, 41, 49], safe = (x, y) => x <= 10 || (x >= 52 && x <= 60 && y >= 10) || LAMPS.some(L => Math.abs(x - L) <= 1 && y >= 9);"
        " while (performance.now() - t0 < 120000) { const W = D.W; if (W.endScreen) break; if (W.busy || W.dlg) { await window.__auto([], 400); continue; }"
        " const p = W.pl, C = W._car || { st: 'idle' }; if (p.x <= 6) break;"
        " if (p.y !== 10) { D.tp(p.x, p.y + (p.y < 10 ? 1 : -1)); await sl(240); continue; }"
        " if (C.st === 'idle') { D.tp(p.x - 1, 10); await sl(240); continue; }"
        " if (safe(p.x, p.y)) { await sl(50); continue; }"
        " let nx = p.x - 1; for (let d = 1; d < 30; d++) { if (safe(p.x - d, 10)) { nx = p.x - 1; break; } if (safe(p.x + d, 10)) { nx = p.x + 1; break; } }"
        " D.tp(nx, 10); await sl(150); } })()")

SOL = [
    [],
    ['use', 'setlist'], ['use', 'photo34'], ['use', 'ctop1'],
    ['use', 'wei'], ['use', 'coatc'], ['use', 'leader'], ['use', 'jbox'],
    ['shot', 'hall'],
    ['use', 'mary', [0]],
    ['expect', f"{D}.W._dn && {D}.W._dn.kind === 'd1' && {D}.W.f.pin"],
    ['js', DANCE, [0, 0]],
    ['expect', f"{D}.W.f.d1 && {D}.W._dn && {D}.W._dn.kind === 'd2'"],
    ['shot', 'dance'],
    ['js', DANCE, [0]],
    ['expect', f"{D}.W.f.d2 && {D}.W.f.ph === 'leave'"],
    ['step', 11, 14],
    ['expect', f"{D}.W.mapId === 'archer' && !{D}.ent('marya').hidden"],
    ['shot', 'outside'],
    ['use', 'cabp'],
    ['expect', f"{D}.W.f.ph === 'drive' && {D}.W.f.inCab && {D}.W.pl.spr === 'cabpR'"],
    ['step', 15, 7], ['step', 25, 7], ['step', 35, 7],
    ['shot', 'drive'],
    ['step', 47, 7, [0, 1]],
    ['expect', f"{D}.W.f.ph === 'gate' && !{D}.W.f.inCab && {D}.ent('gate').s.burn === 2 && !{D}.ent('purse').hidden"],
    ['use', 'gate'], ['use', 'purse'],
    ['shot', 'gate'],
    ['use', 'tdoor'],
    ['expect', f"{D}.W.mapId === 'tavern'"],
    ['use', 'barbc'], ['use', 'logbook'], ['use', 'clipf'], ['use', 'phone'], ['use', 'sleeper'],
    ['shot', 'tavern'],
    ['step', 6, 9],
    ['expect', f"{D}.W.mapId === 'archer' && {D}.W.f.ph === 'walk' && {D}.W.cp.name === 'walk'"],
    ['js', WALK],
    ['expect', f"{D}.W.pl.x <= 8 && !{D}.W.endScreen"],
    ['use', 'hdoor'],
    ['expect', f"{D}.W.mapId === 'ballroom' && {D}.W.f.ph === 'back'"],
    ['shot', 'closed'],
    ['use', 'ctop1'],
    ['expect', f"{D}.W.f.plugged && {D}.ent('jbox').lit"],
    ['use', 'joe', [1, 0]],
    ['expect', f"{D}.W.f.joeTold"],
    ['use', 'jbox', ['418']],
    ['expect', f"{D}.W.f.wrong === 1 && {D}.W.mapId === 'ballroom'"],
    ['use', 'jbox', ['438', 0]],
    ['expect', f"{D}.W.mapId === 'vision' && {D}.W._dn && {D}.W._dn.kind === 'final' && {D}.W._dn.need === 12"],
    ['shot', 'vision'],
    ['js', DANCE],
]
