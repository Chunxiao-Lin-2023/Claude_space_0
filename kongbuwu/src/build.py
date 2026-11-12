"""把源码拼成单文件页面。
   out/index.html     独立页面（GitHub Pages / 本地）
   out/test.html      同上 + window.__dbg 测试钩子
   out/artifact.html  claude.ai artifact 版（不带 doctype）
   ../index.html      只有加 --deploy 才写"""
import os, sys, re, collections
D = os.path.dirname(os.path.abspath(__file__))
src = lambda f: open(os.path.join(D, f), encoding='utf-8').read()
ORDER = sorted(f for f in os.listdir(D) if re.match(r'^\d\d_.*\.js$', f))
game = '\n'.join(src(f) for f in ORDER)
errs = []
dup = [n for n, c in collections.Counter(re.findall(r'^(?:async )?function ([A-Za-z_0-9$]+)', game, re.M)).items() if c > 1]
if dup: errs.append('顶层函数重名（后面的会悄悄覆盖前面的）: ' + ', '.join(dup))
pl = src('11_places.js')
places = re.findall(r"^  (\w+): \{ name: '[^']*', area: '(\w+)', x: (-?\d+), y: (-?\d+)", pl, re.M); P = {m[0]: m for m in places}
areas = set(re.findall(r"(\w+): \{ name: '[^']*', sub:", pl)); npcs = set(re.findall(r"^  (\w+): \{ name: '[^']+', title:", pl, re.M)) | set(re.findall(r" (\w+): \{ name: '[^']+', title:", pl))
E = {m[0]: dict(re.findall(r"'([^']+)': '(\w+)'", m[1])) for m in re.findall(r"^  (\w+): \{ name:.*?exits: \{([^}]*)\}", pl, re.M)}
seen = {}
for k, (_, a, x, y) in P.items():
    if a not in areas: errs.append(f'{k}: 未知区域 {a}')
    if (a, x, y) in seen: errs.append(f'{k} 和 {seen[(a, x, y)]} 在地图上重叠')
    seen[(a, x, y)] = k
for k, ex in E.items():
    for lab, t in ex.items():
        if t not in P: errs.append(f'{k} 的出口「{lab}」指向不存在的 {t}')
        elif k not in E.get(t, {}).values(): errs.append(f'{k} → {t} 是单向出口（回不来）')
st = src('42_story3.js'); steps = re.findall(r"\{ id: '(q_\w+)', ch:", st); order = {q: i for i, q in enumerate(steps)}; order['q_end'] = 10**6
d2 = sorted({q for q in steps if steps.count(q) > 1})
if d2: errs.append('剧情步骤 id 重名: ' + ', '.join(d2))
for m in re.finditer(r"\{ id: '(q_\w+)', ch: \d, title: '[^']*', goal: '[^']*', at: '(\w+)'.*?run: (\w+) \}", st):
    if m[2] not in P: errs.append(f'{m[1]} 的地点 {m[2]} 不存在')
    if not re.search(r'^async function ' + m[3] + r'\(', game, re.M): errs.append(f'{m[1]} 的剧情函数 {m[3]} 不存在')
tk = src('45_talk.js'); n = 0; seen_t = set()
for ln in re.findall(r"^\s*(\{ at: .*\}),?\s*$", tk, re.M):
    n += 1; g = lambda k: (re.search(k + r": '([^']*)'", ln) or [None, None])[1]; at, fr, to, who, t = g('at'), g('from'), g('to'), g('who'), g(', t')
    if at not in P: errs.append('闲话地点不存在: ' + ln[:50])
    if fr not in order or to not in order or order[fr] >= order[to]: errs.append('闲话剧情区间不对: ' + ln[:50])
    if who and re.fullmatch(r'[a-z]\w*', who) and who not in npcs: errs.append('闲话说话人不存在: ' + ln[:50])
    if t in seen_t: errs.append('闲话重复: ' + ln[:50])
    seen_t.add(t)
for m in re.finditer(r"\{ id: '(tk_\w+)', npc: '(\w+)', from: '(\w+)', to: '(\w+)'", tk):
    n += 1
    if m[2] not in npcs or m[3] not in order or m[4] not in order or order[m[3]] >= order[m[4]]: errs.append('闲聊不对: ' + m[1])
for m in re.finditer(r"(\w+): \{ name: '[^']+', title: '[^']*', seal: '\w+', at: '(\w+)'(?:, from: '(\w+)')?", pl):
    if m[2] not in P: errs.append(f'NPC {m[1]} 的地点不存在')
    if m[3] and m[3] not in order: errs.append(f'NPC {m[1]} 的 from 不存在')
if re.search(r'[^:]//[^\n]*\n', game) and re.search(r'^\s*//', game, re.M) is None: pass
# 小剧场指令：命令名、道具贴图、场景名都要存在（拼错了不会报错，只会什么都不演）
spr = set(re.findall(r'^  (\w+)\(g, e, t, R\)', game, re.M)) | set(re.findall(r'SPR\.(\w+) = function', game))
stg = set(re.findall(r'^  (\w+): \{', game[game.find('const STAGES'):game.find('const STAGES') + 60000], re.M))
cmds = {'in', 'at', 'out', 'to', 'turn', 'down', 'up', 'fx', 'prop', 'del', 'stage', 'call', 'hang', 'wait', 'scare', 'creep', 'sfx', 'mirror', 'mus'}
mirs = {'follow', 'lag', 'stare', 'smile', 'close', 'empty', 'other', 'hand', 'crack', 'out', 'off'}
moods = set(re.findall(r'^  (\w+): \{ root', game, re.M))
fxs = {'dark', 'candle', 'rain', 'red', 'tv', 'flash', 'shake', 'light', 'clear', 'flicker', 'steady', 'glitch'}
_sf = game[game.find('const SFX'):game.find('function sfx(')]
sfxs = set(re.findall(r'(?:^  |[{,;] )(\w+)\(\) \{', _sf, re.M))
for m in re.finditer(r'(?:\n|`|\\n)~(\w+)', game):
    if m.group(1) not in sfxs: errs.append('音效不存在: ~' + m.group(1))
for m in re.finditer(r'(?:^|\n|`|\\n)\^(\w+)((?:(?!\\n)[^\n`])*)', game):
    c, rest = m.group(1), m.group(2).split()
    if c not in cmds: errs.append('小剧场指令不存在: ^' + c + ' ' + ' '.join(rest)); continue
    if c == 'prop' and (len(rest) < 4 or rest[1] not in spr): errs.append('小剧场道具贴图不存在: ^prop ' + ' '.join(rest)[:50])
    if c == 'fx' and rest and rest[0] not in fxs: errs.append('小剧场效果不存在: ^fx ' + rest[0])
    if c == 'stage' and rest and rest[0] != 'clear' and rest[0] not in stg: errs.append('小剧场场景不存在: ^stage ' + rest[0])
    if c == 'sfx' and (not rest or rest[0] not in sfxs): errs.append('小剧场声音不存在: ^sfx ' + ' '.join(rest))
    if c == 'mirror' and (not rest or not (rest[0].isdigit() or rest[0] in mirs)): errs.append('^mirror 用法不对: ' + ' '.join(rest))
    if c == 'mus' and (not rest or (rest[0] != 'off' and rest[0] not in moods)): errs.append('^mus 背景氛围不存在: ' + ' '.join(rest))
    if c == 'turn' and (len(rest) < 2 or rest[1] not in 'LRFB'): errs.append('^turn 方向只能是 L/R/F/B: ' + ' '.join(rest))
if errs: sys.exit('构建检查失败:\n  ' + '\n  '.join(errs))
tpl = src('template.html')
IOS = '<meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"><meta name="apple-mobile-web-app-title" content="恐怖屋"><meta name="theme-color" content="#0a0d0f">'
def page(kind):
    pre = {'standalone': '', 'test': 'window.__dbg={};', 'artifact': 'window.__ARTIFACT__=1;'}[kind]
    body = tpl.replace('__IOSMETA__', IOS if kind != 'artifact' else '').replace('__SCRIPTS__', '<script>\n' + pre + '\n' + game + '\n</script>')
    head = '<!doctype html>\n<html lang="zh-CN">\n<head>' if kind != 'artifact' else '<html lang="zh-CN">\n<head>'
    return head + body.replace('<body', '</head>\n<body', 1) + '\n</body>\n</html>\n'
out = os.path.join(D, 'out'); os.makedirs(out, exist_ok=True)
for k, f in [('standalone', 'index.html'), ('test', 'test.html'), ('artifact', 'artifact.html')]:
    open(os.path.join(out, f), 'w', encoding='utf-8').write(page(k))
if '--deploy' in sys.argv:
    open(os.path.join(D, '..', 'index.html'), 'w', encoding='utf-8').write(page('standalone')); print('deployed ../index.html')
print('built', os.path.getsize(os.path.join(out, 'index.html')) // 1024, 'KB ·', len(steps), '步主线 ·', len(P), '个地点 ·', n, '条闲话/闲聊')
