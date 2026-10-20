"""Build nighttales3/index.html from src/.

Usage:  python3 nighttales3/src/build.py [--artifact OUT.html]
- index.html: doctype + iOS meta + PeerJS, served by GitHub Pages (双人联机可用)
- --artifact: no doctype / html wrappers, no PeerJS (claude.ai artifact, 单人)
"""
import os, re, sys, glob
HERE = os.path.dirname(os.path.abspath(__file__))
shell = open(os.path.join(HERE, 'shell.html'), encoding='utf8').read()
parts = sorted(glob.glob(os.path.join(HERE, 'js', '*.js')))
chapters = sorted(glob.glob(os.path.join(HERE, 'chapters', '*.js')))
if '--only' in sys.argv:   # 只打包指定章节（逗号分隔的 id），并行开发时互不影响
    only = sys.argv[sys.argv.index('--only') + 1].split(',')
    chapters = [c for c in chapters if any(os.path.basename(c)[3:-3] == o for o in only)]
main = [p for p in parts if os.path.basename(p).startswith('99_')]
core = [p for p in parts if p not in main]
js = ''
for p in core + chapters + main:
    js += '\n/* ---- %s ---- */\n' % os.path.relpath(p, HERE) + open(p, encoding='utf8').read()
assert shell.count('/*@JS*/') == 1 and shell.count('<!--IOSMETA-->') == 1 and shell.count('<!--PEERJS-->') == 1
assert '</script' not in js
IOS = '''<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="十夜怪谈·叁">
<meta name="theme-color" content="#07060a">'''
PEER = '<script src="https://unpkg.com/peerjs@1.5.5/dist/peerjs.min.js"></script>'
std = '<!doctype html>\n' + shell.replace('<!--IOSMETA-->', IOS).replace('<!--PEERJS-->', PEER).replace('/*@JS*/', js)
out = sys.argv[sys.argv.index('--out') + 1] if '--out' in sys.argv else os.path.join(HERE, '..', 'index.html')
os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
open(out, 'w', encoding='utf8').write(std)
print('built', os.path.normpath(out), len(std), 'bytes,', len(chapters), 'chapters')
if '--artifact' in sys.argv:
    dst = sys.argv[sys.argv.index('--artifact') + 1]
    src = shell.replace('<!--IOSMETA-->', '').replace('<!--PEERJS-->', '').replace('/*@JS*/', 'window.__ARTIFACT__=true;\n' + js)
    head = re.search(r'<head>(.*?)</head>', src, re.S).group(1)
    head = re.sub(r'<meta[^>]*>\s*', '', head).strip()
    body = re.search(r'<body>(.*)</body>', src, re.S).group(1).strip()
    art = head + '\n' + body + '\n'
    assert '<html' not in art and '<body' not in art and art.lstrip().startswith('<title>')
    open(dst, 'w', encoding='utf8').write(art)
    print('artifact', dst, len(art))
