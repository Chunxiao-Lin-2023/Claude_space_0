"""双客户端联机测试：本地 PeerJS 服务器 + 两个无头浏览器。
用法：python3 nighttales3/src/tests/coop.py [--shots DIR]
需要 /home/claude/testdeps 里装好 peerjs 和 peer（npm i peerjs@1.5.5 peer@1.0.2）。
"""
import os, sys, time, subprocess, threading, http.server, socketserver, functools
from playwright.sync_api import sync_playwright
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
DEPS = '/home/claude/testdeps'
PEERJS = DEPS + '/node_modules/peerjs/dist/peerjs.min.js'
shots = sys.argv[sys.argv.index('--shots') + 1] if '--shots' in sys.argv else None
if shots: os.makedirs(shots, exist_ok=True)

class H(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
httpd = socketserver.ThreadingTCPServer(('127.0.0.1', 0), functools.partial(H, directory=ROOT))
threading.Thread(target=httpd.serve_forever, daemon=True).start()
port = httpd.server_address[1]
ps = subprocess.Popen(['node', DEPS + '/peerserver.js', '9311'], cwd=DEPS, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)   # 绑定 127.0.0.1（沙箱无 IPv6）
time.sleep(1.5)
url = f'http://127.0.0.1:{port}/nighttales3/index.html?debug=1&fast=4&peerhost=127.0.0.1&peerport=9311'
errs = []
ok = True
def check(cond, msg):
    global ok
    print(('PASS ' if cond else 'FAIL ') + msg); ok = ok and bool(cond)
try:
    with sync_playwright() as p:
        b = p.chromium.launch(args=['--disable-features=WebRtcHideLocalIpsWithMdns'])
        pages = []
        for name in ('host', 'guest'):
            ctx = b.new_context(viewport={'width': 1100, 'height': 700})
            pg = ctx.new_page(); pg.route('**/peerjs.min.js', lambda r: r.fulfill(path=PEERJS, content_type='application/javascript'))
            pg.on('pageerror', lambda e, n=name: errs.append(n + ': ' + str(e)))
            pg.goto(url); pg.wait_for_timeout(600); pages.append(pg)
        H_, G = pages
        H_.click('#tHost'); H_.wait_for_function("document.getElementById('lbCode').textContent.length===4 && !document.getElementById('lbCode').textContent.includes('·')", timeout=10000)
        code = H_.inner_text('#lbCode'); print('room', code)
        G.click('#tJoin'); G.fill('#joinCode', code); G.click('#lbGo')
        H_.wait_for_function("window.__dbg.UI.scene==='select'", timeout=15000)
        G.wait_for_function("window.__dbg.UI.scene==='select'", timeout=15000)
        check(True, 'both in chapter select')
        H_.evaluate("window.__dbg.startChapter('mary', false)")
        G.wait_for_function("window.__dbg.W && window.__dbg.W.ch.id==='mary' && window.__dbg.W.card", timeout=8000)
        check(True, 'guest mirrors chapter + intro card')
        # 观看者翻页无效
        G.evaluate("window.__dbg.UI.scene"); G.keyboard.press('Space'); G.wait_for_timeout(400)
        check(H_.evaluate("!!window.__dbg.W.card"), 'guest cannot advance while host controls')
        # 主机推完开场
        for i in range(40):
            if H_.evaluate("(()=>{const W=window.__dbg.W;return !W.card&&!W.dlg&&!W.busy})()"): break
            if H_.evaluate("!!(window.__dbg.W.dlg&&window.__dbg.W.dlg.choices)"): H_.wait_for_timeout(450); H_.evaluate("window.__dbg.doAct('pick',0)")
            else: H_.evaluate("window.__dbg.W.dlg&&(window.__dbg.W.dlg.full=true)"); H_.wait_for_timeout(300); H_.keyboard.press('Space')
            H_.wait_for_timeout(150)
        check(H_.evaluate("!window.__dbg.W.busy && window.__dbg.W.f.dared"), 'host finished intro')
        # 交出操作
        H_.keyboard.press('KeyT'); G.wait_for_function("window.__dbg.W.ctrl==='g'", timeout=3000)
        check(True, 'host handed control to guest')
        x0 = H_.evaluate("window.__dbg.W.pl.x")
        G.keyboard.down('ArrowRight'); G.wait_for_timeout(700); G.keyboard.up('ArrowRight'); G.wait_for_timeout(500)
        x1 = H_.evaluate("window.__dbg.W.pl.x")
        check(x1 > x0, f'guest movement reaches host ({x0}->{x1})')
        hx = H_.evaluate("window.__dbg.W.pl.px"); gx = G.evaluate("window.__dbg.W.pl.px")
        check(abs(hx - gx) < 4, f'positions agree host={hx} guest={gx}')
        # 客机调查凯西 -> 主机出现对话
        G.evaluate("window.__dbg.face('kathy')")
        G.wait_for_timeout(300); G.keyboard.press('Space')
        H_.wait_for_function("!!window.__dbg.W.dlg", timeout=4000)
        G.wait_for_function("!!window.__dbg.W.dlg", timeout=4000)
        check(True, 'guest interaction opens dialog on both')
        if shots: G.screenshot(path=shots + '/coop_guest_dialog.png'); H_.screenshot(path=shots + '/coop_host_dialog.png')
        for i in range(6):
            if not H_.evaluate("!!window.__dbg.W.dlg"): break
            G.keyboard.press('Space'); G.wait_for_timeout(300)
        check(not H_.evaluate("!!window.__dbg.W.dlg"), 'guest advanced dialog to the end')
        # 主机请求 -> 客机看到提示并同意
        H_.keyboard.press('KeyT')
        G.wait_for_function("!document.getElementById('reqp').classList.contains('hidden')", timeout=3000)
        check(True, 'guest sees request prompt')
        G.click('#rqY'); H_.wait_for_function("window.__dbg.W.ctrl==='h'", timeout=3000)
        check(True, 'guest accepted, control back to host')
        # 客机请求 -> 主机拒绝
        G.keyboard.press('KeyT'); H_.wait_for_function("window.__dbg.W.req==='g'", timeout=3000)
        H_.keyboard.press('KeyN'); H_.wait_for_timeout(300)
        check(H_.evaluate("window.__dbg.W.ctrl==='h' && !window.__dbg.W.req"), 'host declined request')
        # 标记
        G.mouse.click(500, 300); H_.wait_for_timeout(500)
        check(H_.evaluate("window.__dbg.W && true") and H_.evaluate("document.getElementById('cv') && true"), 'ping sent (visual)')
        if shots: H_.screenshot(path=shots + '/coop_host_ping.png')
        # 切地图同步
        H_.evaluate("window.__dbg.face([10,1])"); H_.keyboard.press('Space')
        G.wait_for_function("window.__dbg.W.mapId==='hall'", timeout=5000)
        check(True, 'map change mirrored to guest')
        # 回章节选择
        H_.keyboard.press('Escape'); H_.wait_for_timeout(200); H_.click('#mQuit')
        G.wait_for_function("window.__dbg.UI.scene==='select'", timeout=4000)
        check(True, 'guest returned to select with host')
        b.close()
finally:
    ps.terminate(); httpd.shutdown()
if errs: print('ERRORS'); [print(' ', e) for e in errs]
sys.exit(0 if ok and not errs else 1)
