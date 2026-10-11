"""Assemble src parts -> work/game.html (lightweight, placeholders) and inject atlases.
Outputs: out/standalone.html (doctype + iOS meta), out/artifact.html (no doctype), out/test.html (standalone + __dbg)."""
import base64, json, os, sys
R = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(R, 'work', 'src'); ATL = os.path.join(R, 'work', 'atlas'); OUT = os.path.join(R, 'out')
os.makedirs(OUT, exist_ok=True)
order = ['a_shell.html', 'b_maps.js', 'c_data.js', 'd_util.js', 'e_world.js', 'f_heroes.js', 'g_render.js', 'h_play.js', 'i_menu.js', 'j_net.js', 'k_main.js']
src = ''.join(open(os.path.join(SRC, f)).read() + '\n' for f in order)
open(os.path.join(R, 'work', 'game.html'), 'w').write(src)
meta = json.load(open(os.path.join(ATL, 'atlas.json')))
def rep(s, old, new):
    assert s.count(old) == 1, (old, s.count(old)); return s.replace(old, new)
g = rep(src, '__ATLAS_META__', json.dumps(meta, separators=(',', ':')))
for k in ['warmage', 'sorc', 'paladin', 'ranger', 'alch', 'blade', 'shield', 'sapper', 'shaman', 'grunt', 'kobold', 'archer', 'ogre', 'bat', 'chief', 'props']:
    b = base64.b64encode(open(os.path.join(ATL, k + '.webp'), 'rb').read()).decode()
    g = rep(g, f"'__SHEET_{k}__'", f"'data:image/webp;base64,{b}'")
IOS = ('<meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes">'
       '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"><meta name="apple-mobile-web-app-title" content="裂隙守卫"><meta name="theme-color" content="#0b090e">')
std = '<!doctype html>\n' + rep(g, '__IOS_META__', IOS)
art = rep(g, '__IOS_META__', '')
import re
art = rep(art, '<html lang="zh-CN"><head><meta charset="utf-8">\n', '')
art = re.sub(r'<meta name="viewport"[^>]*>\n', '', art, count=1)
art = rep(art, '</style></head><body>', ':root{color-scheme:dark}</style>')
art = rep(art, '</script>\n</body></html>', '</script>')
DBG = """window.__dbg={get G(){return G},get P(){return P},get ME(){return ME},get NET(){return NET},get STATE(){return STATE},startLevel,doAction,placeTrap,spawnOrc,startWave,updWorld,selectSlot,act,endLevel,
 give(n){G.gold+=n},skip(){for(const e of G.enemies)if(alive(e))killEnemy(e,{p:0});G.spawnQ.length=0;},tp(x,y){ME.x=x;ME.y=y;},netJoin,netHost,levelScreen,titleScreen,SAVE,CAM};"""
tst = rep(std, '/*__DBG__*/', DBG)
for name, s in [('standalone.html', std), ('artifact.html', art), ('test.html', tst)]:
    open(os.path.join(OUT, name), 'w').write(s)
    print(name, len(s) // 1024, 'KB')
