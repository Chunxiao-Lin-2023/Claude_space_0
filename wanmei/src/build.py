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
tpl = src('template.html')
IOS = '<meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"><meta name="apple-mobile-web-app-title" content="完美世界"><meta name="theme-color" content="#0b0907">'
def page(kind):
    pre = {'standalone': '', 'test': 'window.__dbg={speed:1};', 'artifact': 'window.__ARTIFACT__=1;'}[kind]
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
print('order:', ' '.join(ORDER)); print('built', os.path.getsize(os.path.join(out, 'index.html')) // 1024, 'KB')
