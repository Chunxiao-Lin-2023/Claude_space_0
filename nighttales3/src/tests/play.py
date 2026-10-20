"""十夜怪谈·叁 · 无头自动通关测试

用法：python3 nighttales3/src/tests/play.py [章节id ...] [--shots DIR] [--page 相对仓库根的html路径]
从仓库根目录起一个 http 服务器，打开 /nighttales3/index.html?debug=1&fast=8（或 --page 指定的构建），
按 tests/sol/<章节id>.py 里的 SOL 步骤自动通关，检查最后进入「完」结局、且没有 pageerror。

步骤格式：
  第一项可以是开场选项列表（整数），用于开场剧情里的选择
  ['use', 实体id 或 [x,y], [选项...]]   传送到实体旁、面向它并调查；自动翻完对话，遇到选项按顺序选（默认 0）
  ['step', x, y, [选项...]]             传送到格子并触发踩踏事件（出口、机关）
  ['wait', 毫秒]  ['js', 代码, [选项]]  ['expect', 返回真值的 JS]  ['shot', 名字]
  ['retry']                             上一步死亡后从检查点重来（只有紧跟 retry 的那一步允许死亡）
密码盘（S.keypad）也从选项列表里取一个字符串（逐字符按键）或一个列表（每项一个键，如 ["10","开"]）。
"""
import os, sys, json, time, threading, http.server, socketserver, functools
from playwright.sync_api import sync_playwright
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
import importlib.util, glob as _glob
SOL = {}
for _f in sorted(_glob.glob(os.path.join(HERE, 'sol', '*.py'))):
    _sp = importlib.util.spec_from_file_location('sol_' + os.path.basename(_f)[:-3], _f); _m = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(_m)
    SOL[os.path.basename(_f)[:-3]] = _m.SOL
WARN = []
PEERJS = '/home/claude/testdeps/node_modules/peerjs/dist/peerjs.min.js'

AUTO_JS = r"""
window.__auto = async (picks, maxMs) => {
  const D = window.__dbg, t0 = performance.now(); picks = picks || [];
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  let idle = 0;
  while (performance.now() - t0 < (maxMs || 20000)) {
    const W = D.W; if (!W) { await sleep(60); continue; }
    if (W.endScreen) return 'end:' + W.endScreen.kind;
    if (W.dlg && W.dlg.choices) { const d = W.dlg; d.full = true; await sleep(260); if (D.W.dlg === d) { const p = picks.length ? picks[0] : 0; D.doAct('pick', p); await sleep(40); if (D.W.dlg !== d && picks.length) picks.shift(); } idle = 0; continue; }
    if (W.dlg || W.card || W.note) { if (W.dlg) W.dlg.full = true; await sleep(W.card ? 520 : 170); D.doAct('adv'); idle = 0; continue; }
    if (W.keypad) { const v = picks.length ? picks.shift() : ''; const ks = Array.isArray(v) ? v : String(v).split(''); for (const ch of ks) D.doAct('key', ch); await sleep(500); continue; }
    if (W.busy) { idle = 0; await sleep(50); continue; }
    if (++idle > 3) return 'idle';
    await sleep(50);
  }
  return 'timeout';
};
window.__reach = () => {   // 从玩家当前位置真实走路能到的格子（当前地图）
  const D = window.__dbg, W = D.W, m = W.maps[W.mapId], seen = new Set(), q = [[W.pl.x, W.pl.y]];
  seen.add(W.pl.x + ',' + W.pl.y);
  while (q.length) { const [x, y] = q.pop(); for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) { const nx = x + dx, ny = y + dy, k = nx + ',' + ny; if (seen.has(k)) continue; if (!passable(m, nx, ny, W.pl)) continue; seen.add(k); q.push([nx, ny]); } }
  return { map: W.mapId, cells: [...seen] };
};
window.__cands = t => {   // 能调查目标的所有站位（和 __dbg.face 的候选一致）
  const D = window.__dbg, W = D.W, m = W.maps[W.mapId];
  if (typeof t === 'number') return null;
  const e = Array.isArray(t) ? m.ents.find(z => !z.hidden && Math.round(z.px / TS) <= t[0] && t[0] < Math.round(z.px / TS) + z.w && Math.round(z.py / TS) <= t[1] && t[1] < Math.round(z.py / TS) + z.h && z.on) : D.ent(t);
  if (!e) return null;
  const ex = Math.round(e.px / TS), ey = Math.round(e.py / TS), c = [];
  for (let x = ex; x < ex + e.w; x++) { c.push(x + ',' + (ey + e.h)); c.push(x + ',' + (ey - 1)); }
  for (let y = ey; y < ey + e.h; y++) { c.push((ex - 1) + ',' + y); c.push((ex + e.w) + ',' + y); }
  if (!e.solid) for (let x = ex; x < ex + e.w; x++) for (let y = ey; y < ey + e.h; y++) c.push(x + ',' + y);
  return c;
};
"""

def serve():
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=ROOT)
    handler.log_message = lambda *a: None
    socketserver.TCPServer.allow_reuse_address = True
    httpd = socketserver.ThreadingTCPServer(('127.0.0.1', 0), handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd

def run_chapter(page, cid, steps, shots=None):
    log = []
    page.evaluate(f"window.__dbg.store.del('cp.{cid}'); window.__dbg.startChapter('{cid}', false)")
    page.wait_for_timeout(200)
    def auto(picks=None, ms=30000):
        r = page.evaluate("([p,m]) => window.__auto(p,m)", [picks or [], ms])
        return r
    r = auto(steps[0] if steps and isinstance(steps[0], list) and all(isinstance(x, int) for x in steps[0]) else [])
    i0 = 1 if steps and isinstance(steps[0], list) and all(isinstance(x, int) for x in steps[0]) else 0
    shot_n = 0
    def check_reach(cid, st, pre):
        now = page.evaluate("(() => { const W = window.__dbg.W; return {map: W.mapId, x: W.pl.x, y: W.pl.y}; })()")
        cells = set(pre['cells'])
        ok = f"{now['x']},{now['y']}" in cells or (pre.get('cands') and any(c in cells for c in pre['cands']))
        if now['map'] == pre['map'] and not ok:
            WARN.append(f"{cid}: 从 {tuple(pre['xy'])} 走不到 {st[:3] if st[0]=='step' else st[:2]} -> ({now['x']},{now['y']}) on {now['map']}（可达 {len(cells)} 格；测试是传送过去的，真人可能被堵住）")
    rest = steps[i0:]
    for si, st in enumerate(rest):
        kind = st[0]
        if kind in ('use', 'step'):
            pre = page.evaluate("window.__reach()")
            pre['cands'] = page.evaluate("t => window.__cands(t)", st[1]) if kind == 'use' else None
            pre['xy'] = page.evaluate("(() => { const W = window.__dbg.W; return [W.pl.x, W.pl.y]; })()")
        if kind == 'use':
            tgt = st[1]; picks = st[2] if len(st) > 2 else []
            ok = page.evaluate("t => window.__dbg.face(t)", tgt)
            check_reach(cid, st, pre)
            if not ok: raise AssertionError(f'{cid}: cannot reach {tgt} on map {page.evaluate("window.__dbg.W.mapId")}')
            page.evaluate("window.__dbg.doAct('use')")
            r = auto(picks)
        elif kind == 'step':
            page.evaluate("([x,y]) => window.__dbg.tp(x,y)", [st[1], st[2]])
            check_reach(cid, st, pre)
            page.evaluate("([x,y]) => window.__dbg.step(x,y)", [st[1], st[2]])
            r = auto(st[3] if len(st) > 3 else [])
        elif kind == 'wait':
            page.wait_for_timeout(st[1]); r = auto()
        elif kind == 'js':
            page.evaluate(st[1]); r = auto(st[2] if len(st) > 2 else [])
        elif kind == 'shot':
            if shots:
                shot_n += 1; page.screenshot(path=os.path.join(shots, f'{cid}_{shot_n:02d}_{st[1]}.png'))
            continue
        elif kind == 'retry':   # 死亡后从检查点重来（上一步允许以死亡结束）
            page.wait_for_timeout(1200); page.evaluate("window.__dbg.retryFromCP()"); page.wait_for_timeout(400); r = auto()
        elif kind == 'expect':
            v = page.evaluate(st[1])
            if not v: raise AssertionError(f'{cid}: expect failed: {st[1]}')
            continue
        state = page.evaluate("(() => { const W = window.__dbg.W; return W ? {map: W.mapId, x: W.pl.x, y: W.pl.y, goal: W.goal, end: W.endScreen && W.endScreen.kind, inv: W.inv} : null })()")
        log.append((st, r, state))
        if state and state['end'] == 'die' and not (si + 1 < len(rest) and rest[si + 1][0] == 'retry'):
            raise AssertionError(f'{cid}: died at step {st} -> {state}')
    end = page.evaluate("window.__dbg.W && window.__dbg.W.endScreen && window.__dbg.W.endScreen.kind")
    if shots:
        page.screenshot(path=os.path.join(shots, f'{cid}_99_end.png'))
    return end, log

def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    shots = None
    pagep = 'nighttales3/index.html'
    if '--page' in sys.argv:
        pagep = sys.argv[sys.argv.index('--page') + 1]; args = [a for a in args if a != pagep]
    if '--shots' in sys.argv:
        shots = sys.argv[sys.argv.index('--shots') + 1]; os.makedirs(shots, exist_ok=True); args = [a for a in args if a != shots]
    httpd = serve(); port = httpd.server_address[1]
    errors = []; results = {}
    with sync_playwright() as p:
        b = p.chromium.launch()
        ctx = b.new_context(viewport={'width': 1280, 'height': 800})
        page = ctx.new_page()
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.on('console', lambda m: errors.append('console: ' + m.text) if m.type == 'error' else None)
        if os.path.exists(PEERJS):
            page.route('**/peerjs.min.js', lambda r: r.fulfill(path=PEERJS, content_type='application/javascript'))
        else:
            page.route('**/peerjs.min.js', lambda r: r.fulfill(body='', content_type='application/javascript'))
        page.goto(f'http://127.0.0.1:{port}/{pagep}?debug=1&fast=8')
        page.wait_for_timeout(500)
        page.add_script_tag(content=AUTO_JS)
        ids = args or [c for c in page.evaluate("window.__dbg.CHAPTERS.map(c => c.id)")]
        for cid in ids:
            if cid not in SOL: results[cid] = 'NO SOLUTION'; continue
            try:
                end, log = run_chapter(page, cid, SOL[cid], shots)
                results[cid] = 'OK' if end == 'end' else f'FAIL end={end} last={log[-1] if log else None}'
            except Exception as e:
                results[cid] = 'FAIL ' + str(e)[:400]
        b.close()
    httpd.shutdown()
    for k, v in results.items(): print(f'{k:12s} {v}')
    if WARN: print('REACH WARNINGS:'); [print('  ', w) for w in WARN]
    if errors: print('ERRORS:'); [print('  ', e[:300]) for e in errors[:20]]
    sys.exit(0 if all(v == 'OK' for v in results.values()) and not errors else 1)

if __name__ == '__main__':
    main()
