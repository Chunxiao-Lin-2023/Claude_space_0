"""恐怖屋夜晚任务 · 地图总览：把每章每张地图整张画出来（不裁镜头），存成 PNG，方便检查“看得出是居民楼 / 学校 / 医院”。
用法：python3 kongbuwu/night/tests/atlas.py [章节id ...] [--out DIR]   （默认 /tmp/kbw/atlas）"""
import os, sys, base64, threading, http.server, socketserver, functools
from playwright.sync_api import sync_playwright
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
args = sys.argv[1:]; out = '/tmp/kbw/atlas'
if '--out' in args: i = args.index('--out'); out = args[i + 1]; del args[i:i + 2]
os.makedirs(out, exist_ok=True)
H = functools.partial(http.server.SimpleHTTPRequestHandler, directory=ROOT); H.log_message = lambda *a: None
srv = socketserver.TCPServer(('127.0.0.1', 0), H); port = srv.server_address[1]; threading.Thread(target=srv.serve_forever, daemon=True).start()
JS = r"""(ids) => { const res = []; for (const ch of CHAPTERS) { if (ids.length && !ids.includes(ch.id)) continue; W = newWorld(ch);
  for (const id in W.maps) { const m = W.maps[id]; W.mapId = id; renderMapCache(m); const c = document.createElement('canvas'); c.width = m.w * TS; c.height = m.h * TS + 20; const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    g.fillStyle = '#000'; g.fillRect(0, 0, c.width, c.height); g.drawImage(m.cache, 0, 20);
    const list = m.ents.filter(e => !e.hidden && e.spr).sort((a, b) => (a.decal ? -1e5 : 0) + (a.z || 0) * 1e4 + a.py + a.h * TS - ((b.decal ? -1e5 : 0) + (b.z || 0) * 1e4 + b.py + b.h * TS));
    for (const e of list) { const spr = sprOf(e.spr), x = Math.round(e.px + (e.ox || 0)), y = Math.round(e.py + (e.oy || 0)) + 20;
      try { if (typeof spr === 'object') { if (spr.big) g.drawImage(personSprite(spr, e.dir, 0), x - 8, y - 32, 32, 48); else g.drawImage(personSprite(spr, e.dir, 0), x, y - 8); }
        else { const fn = (W.ch.sprites && W.ch.sprites[spr]) || SPR[spr]; if (fn) { g.globalAlpha = Math.max(.35, e.alpha ?? 1); const R = (a, b, w, h, col) => { if (!col) return; g.fillStyle = col; g.fillRect(x + Math.floor(a), y + Math.floor(b), Math.ceil(w), Math.ceil(h)); }; const pe = Object.assign({}, e, e.s); pe.sx = x; pe.sy = y; fn(g, pe, 1, R); g.globalAlpha = 1; } } } catch (er) { }
    }
    g.fillStyle = '#fff'; g.font = '12px sans-serif'; g.fillText(ch.id + ' / ' + id + (m.def.name ? ' · ' + m.def.name : '') + '  ' + m.w + '×' + m.h, 4, 14);
    res.push([ch.id, id, c.toDataURL()]); } } return res; }"""
with sync_playwright() as p:
    b = p.chromium.launch(args=['--disable-gpu']); pg = b.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(f'http://127.0.0.1:{port}/kongbuwu/night/out/night.html?debug=1'); pg.wait_for_function('window.__dbg && typeof CHAPTERS !== "undefined"')
    for ch, mid, url in pg.evaluate(JS, args):
        open(os.path.join(out, f'{ch}__{mid}.png'), 'wb').write(base64.b64decode(url.split(',')[1]))
    b.close()
print('atlas →', out, len(os.listdir(out)), 'maps', errs[:3])
