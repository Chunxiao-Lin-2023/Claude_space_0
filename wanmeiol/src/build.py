"""Concatenate the game sources into single-file pages.
   out/index.html     standalone page (GitHub Pages / local)
   out/test.html      same + window.__dbg hooks for headless tests
   out/artifact.html  claude.ai artifact build (no doctype; co-op disabled there by CSP)
   ../index.html      written only with --deploy"""
import os, sys, re
D = os.path.dirname(os.path.abspath(__file__))
src = lambda f: open(os.path.join(D, f), encoding='utf-8').read()
ORDER = sorted(f for f in os.listdir(D) if re.match(r'^\d\d_.*\.js$', f))
game = '\n'.join(src(f) for f in ORDER)
import collections
dup = [n for n, c in collections.Counter(re.findall(r'^(?:async )?function ([A-Za-z_0-9]+)', game, re.M)).items() if c > 1]
if dup: sys.exit('duplicate top-level functions (the later one silently wins): ' + ', '.join(dup))
# NPC chatter must say where (at) and when (from/to), and only name places, quest steps and people that exist
def check_chatter():
    places = set(re.findall(r'^  (\w+): \{ name:', src('11_places.js'), re.M)); areas = set(re.findall(r'^  (\w+): \{ name: .*sub:', src('11_places.js'), re.M))
    npcs = set(re.findall(r"^  (\w+): \{ name: '[^']+', title:", src('11_places.js'), re.M)); steps = re.findall(r"\{ id: '(q_\w+)', ch:", src('40_story.js')); order = {q: i for i, q in enumerate(steps)}
    body = src('45_npc.js'); body = body[body.index('const CHATTER = ['):]; body = body[:body.index('\n];')]
    errs = []
    for ln in re.findall(r'^\s*(\{ at:.*\}),?\s*$', body, re.M):
        g = lambda k: (re.search(k + r": '([^']*)'", ln) or [None, None])[1]
        at, fr, to, who, pet = g('at'), g('from'), g('to'), g('who'), g('pet')
        if at == '*':
            if not pet: errs.append('"*" line without pet: ' + ln[:60])
            continue
        if at not in places and at not in areas: errs.append('unknown place ' + str(at) + ': ' + ln[:60])
        if not fr or not to: errs.append('missing from/to: ' + ln[:60]); continue
        if fr not in order or to not in order: errs.append('unknown quest step: ' + ln[:60]); continue
        if order[fr] > order[to]: errs.append('from after to: ' + ln[:60])
        if who and re.fullmatch(r'[a-z]\w*', who) and who not in npcs: errs.append('unknown npc ' + who + ': ' + ln[:60])
    n = len(re.findall(r'^\s*\{ at:', body, re.M))
    if errs: sys.exit('CHATTER check failed:\n  ' + '\n  '.join(errs))
    return n
nchat = check_chatter()
tpl = src('template.html')
IOS = '<meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"><meta name="apple-mobile-web-app-title" content="完美世界OL"><meta name="theme-color" content="#100d0a">'
def page(kind):
    pre = {'standalone': '', 'test': 'window.__dbg={};', 'artifact': 'window.__ARTIFACT__=1;'}[kind]
    scripts = '<script>\n' + pre + '\n' + game + '\n</script>'
    body = tpl.replace('__IOSMETA__', IOS if kind != 'artifact' else '').replace('__SCRIPTS__', scripts)
    head = '<!doctype html>\n<html lang="zh-CN">\n<head>' if kind != 'artifact' else '<html lang="zh-CN">\n<head>'
    return head + body.replace('<body>', '</head>\n<body>', 1) + '\n</html>\n'
out = os.path.join(D, 'out'); os.makedirs(out, exist_ok=True)
for k, f in [('standalone', 'index.html'), ('test', 'test.html'), ('artifact', 'artifact.html')]:
    open(os.path.join(out, f), 'w', encoding='utf-8').write(page(k))
if '--deploy' in sys.argv:
    open(os.path.join(D, '..', 'index.html'), 'w', encoding='utf-8').write(page('standalone'))
    print('deployed ../index.html')
print('built', os.path.getsize(os.path.join(out, 'index.html')) // 1024, 'KB ·', nchat, 'NPC lines checked')
