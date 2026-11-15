"""把源码拼成单文件页面。
   out/index.html     独立页面（GitHub Pages / 本地）
   out/test.html      同上 + window.__dbg 测试钩子
   out/artifact.html  claude.ai artifact 版（不能联机，不显示游戏厅按钮）
   ../index.html      只有加 --deploy 才写
   构建前用 node 跑 check.js 检查剧本数据（id 拼错、引用不存在的线索等）"""
import json, os, sys, re, collections, subprocess
D = os.path.dirname(os.path.abspath(__file__))
src = lambda f: open(os.path.join(D, f), encoding='utf-8').read()
ORDER = sorted(f for f in os.listdir(D) if re.match(r'^\d\d_.*\.js$', f))
TEXT = {f[:-4]: open(os.path.join(D, 'text', f), encoding='utf-8').read().strip() for f in sorted(os.listdir(os.path.join(D, 'text'))) if f.endswith('.txt')}
game = 'const TEXT = ' + json.dumps(TEXT, ensure_ascii=False) + ';\n' + '\n'.join(src(f) for f in ORDER)
dup = [n for n, c in collections.Counter(re.findall(r'^(?:async )?function ([A-Za-z_0-9$]+)', game, re.M)).items() if c > 1]
if dup: sys.exit('顶层函数重名: ' + ', '.join(dup))
out = os.path.join(D, 'out'); os.makedirs(out, exist_ok=True)
open(os.path.join(out, 'game.js'), 'w', encoding='utf-8').write(game)
r = subprocess.run(['node', os.path.join(D, 'check.js'), os.path.join(out, 'game.js')], capture_output=True, text=True)
if r.returncode: sys.exit('剧本数据检查失败:\n' + r.stdout + r.stderr)
print(r.stdout.strip())
tpl = src('template.html')
IOS = '<meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"><meta name="apple-mobile-web-app-title" content="推理馆"><meta name="theme-color" content="#0e1218">'
def page(kind):
    pre = {'standalone': '', 'test': 'window.__dbg={};', 'artifact': 'window.__ARTIFACT__=1;'}[kind]
    body = tpl.replace('__IOSMETA__', IOS if kind != 'artifact' else '').replace('__SCRIPTS__', '<script>\n' + pre + '\n' + game + '\n</script>')
    head = '<!DOCTYPE html>\n<html lang="zh-CN">\n<head>'  # 新版 artifact 服务器也要求 doctype
    return head + body.replace('<body', '</head>\n<body', 1) + '\n</body>\n</html>\n'
for k, f in [('standalone', 'index.html'), ('test', 'test.html'), ('artifact', 'artifact.html')]:
    open(os.path.join(out, f), 'w', encoding='utf-8').write(page(k))
if '--deploy' in sys.argv:
    open(os.path.join(D, '..', 'index.html'), 'w', encoding='utf-8').write(page('standalone')); print('deployed ../index.html')
print('built', os.path.getsize(os.path.join(out, 'index.html')) // 1024, 'KB')
