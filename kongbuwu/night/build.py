"""恐怖屋 · 夜晚任务（百物语引擎）构建。

python3 kongbuwu/night/build.py [--only id,id]
  out/night.html      单独的页面（测试用：?debug=1&fast=8，tests/play.py 用它）
  out/night_embed.js  const NIGHT_HTML = "…"; ——恐怖屋 src/build.py 把它拼进单文件页面，开夜晚任务时放进 iframe
顺序：engine/00–50 → lib/*.js → chapters/*.js → main.js
"""
import os, re, sys, glob, json
D = os.path.dirname(os.path.abspath(__file__))
rd = lambda p: open(p, encoding='utf8').read()
engine = sorted(glob.glob(os.path.join(D, 'engine', '*.js')))
lib = sorted(glob.glob(os.path.join(D, 'lib', '*.js')))
chapters = sorted(glob.glob(os.path.join(D, 'chapters', '*.js')))
if '--only' in sys.argv:
    only = sys.argv[sys.argv.index('--only') + 1].split(',')
    chapters = [c for c in chapters if any(re.search(r"id: '" + o + "'", rd(c)) for o in only) or os.path.basename(c).startswith('00_')]
js = ''
for p in engine + lib + chapters + [os.path.join(D, 'main.js')]:
    js += '\n/* ---- %s ---- */\n' % os.path.relpath(p, D) + rd(p)
assert '</script' not in js
errs = []
ids = re.findall(r"defChapter\((?:Object\.assign\(\{\}, \w+, )?\{\s*id: '(\w+)'", js)
dup = sorted({i for i in ids if ids.count(i) > 1})
if dup: errs.append('章节 id 重名: ' + ', '.join(dup))
# 音效 / 环境声名字要存在（拼错了不会报错，只会没声音）
core = rd(os.path.join(D, 'engine', '00_core.js'))
i0 = core.find('  sfx(name)'); i1 = core.find('  ambient(name)'); i2 = core.find('\n  }', core.find('switch', i1))
sfx = set(re.findall(r"case '(\w+)'", core[i0:i1])); amb = set(re.findall(r"case '(\w+)'", core[i1:i2])) | set(re.findall(r"(\w+): \{", core[i1:i2]))
for f in chapters + lib:
    t = rd(f)
    for m in re.finditer(r"(?:S\.sfx\(|sfx: )'(\w+)'", t):
        if m.group(1) not in sfx: errs.append(os.path.basename(f) + ' 音效不存在: ' + m.group(1))
    for m in re.finditer(r"(?:S\.amb\(|amb: )'(\w+)'", t):
        if amb and m.group(1) not in amb and m.group(1) != 'none': errs.append(os.path.basename(f) + ' 环境声不存在: ' + m.group(1))
if errs: sys.exit('夜晚任务构建检查失败:\n  ' + '\n  '.join(errs))
shell = rd(os.path.join(D, 'engine', 'shell.html'))
assert shell.count('/*@JS*/') == 1
html = '<!doctype html>\n' + shell.replace('<!--IOSMETA-->', '').replace('<!--PEERJS-->', '').replace('/*@JS*/', js)
html = html.replace('<title>', '<title>恐怖屋 · 夜 · ', 1)
os.makedirs(os.path.join(D, 'out'), exist_ok=True)
open(os.path.join(D, 'out', 'night.html'), 'w', encoding='utf8').write(html)
emb = 'const NIGHT_HTML = ' + json.dumps(html, ensure_ascii=False).replace('</', '<\\/') + ';\n'
emb += 'const NIGHT_IDS = ' + json.dumps(ids) + ';\n'
open(os.path.join(D, 'out', 'night_embed.js'), 'w', encoding='utf8').write(emb)
print('night built', len(html) // 1024, 'KB ·', len(ids), '个夜晚任务')
