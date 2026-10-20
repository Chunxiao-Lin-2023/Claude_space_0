#!/usr/bin/env python3
"""百戏茶馆 build: src/core/* + src/games/*.js -> ../index.html (standalone) and out/artifact.html.

Usage:
  python3 build.py                       # full build -> baixi/index.html + src/out/artifact.html
  python3 build.py --only gomoku,chess --out /path/test.html   # partial build for testing (no index.html written)
Every game file is syntax-checked with node and wrapped in its own function scope + try/catch,
so one broken game cannot take down the lobby.
"""
import os, re, sys, glob, subprocess, argparse
R = os.path.dirname(os.path.abspath(__file__))
CORE = ['00_util.js', '10_sfx.js', '20_draw.js', '30_net.js', '40_runtime.js', '50_lobby.js', '60_ai.js']
ap = argparse.ArgumentParser(); ap.add_argument('--only'); ap.add_argument('--out'); ap.add_argument('--nocheck', action='store_true')
A = ap.parse_args()

def rep(s, old, new):
    assert s.count(old) == 1, (old, s.count(old)); return s.replace(old, new)

def check(path):
    if A.nocheck: return
    r = subprocess.run(['node', '--check', path], capture_output=True, text=True)
    if r.returncode: sys.exit('SYNTAX ERROR in %s\n%s' % (path, r.stderr))

files = sorted(glob.glob(os.path.join(R, 'games', '*.js')))
if A.only:
    want = set(A.only.split(','))
    files = [f for f in files if os.path.basename(f)[:-3] in want or os.path.basename(f).startswith('_')]
js = []
for f in CORE:
    p = os.path.join(R, 'core', f); check(p); js.append('/* ---- core/%s ---- */\n' % f + open(p, encoding='utf-8').read())
for p in files:
    check(p); name = os.path.basename(p)[:-3]
    body = open(p, encoding='utf-8').read()
    js.append('/* ---- games/%s ---- */\ntry{(function(){\n%s\n})();}catch(e){console.error("game load failed: %s",e);(BX.loadErrors=BX.loadErrors||[]).push("%s: "+e.message);}' % (name, body, name, name))
p = os.path.join(R, 'core', '99_boot.js'); check(p); js.append(open(p, encoding='utf-8').read())
JS = '\n'.join(js)
assert '</script' not in JS.lower(), 'a source file contains </script'
shell = open(os.path.join(R, 'core', 'shell.html'), encoding='utf-8').read()
css = open(os.path.join(R, 'core', 'style.css'), encoding='utf-8').read()
page = rep(rep(shell, '/*__CSS__*/', css), '/*__JS__*/', JS)
IOS = ('<meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes">'
       '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"><meta name="apple-mobile-web-app-title" content="百戏茶馆"><meta name="theme-color" content="#2e1d10">\n')
std = '<!doctype html>\n' + rep(page, '__IOS_META__', IOS)
if A.out:
    open(A.out, 'w', encoding='utf-8').write(std); print(A.out, len(std) // 1024, 'KB', len(files), 'games'); sys.exit(0)
open(os.path.join(R, '..', 'index.html'), 'w', encoding='utf-8').write(std)
# artifact: no doctype / iOS meta / viewport (host provides), online disabled
art = rep(page, '__IOS_META__', '')
art = re.sub(r'<meta name="viewport"[^>]*>\n', '', art, count=1)
art = rep(art, "'use strict';\n/* ===================== 百戏茶馆 core", "'use strict';\nwindow.BX_ARTIFACT=1;\n/* ===================== 百戏茶馆 core")
os.makedirs(os.path.join(R, 'out'), exist_ok=True)
open(os.path.join(R, 'out', 'artifact.html'), 'w', encoding='utf-8').write(art)
print('index.html', len(std) // 1024, 'KB;', 'artifact.html', len(art) // 1024, 'KB;', len(files), 'game files')
