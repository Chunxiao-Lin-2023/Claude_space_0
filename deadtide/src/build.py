"""Build deadtide from src/.
   python3 deadtide/src/build.py            -> src/out/index.html (standalone), src/out/test.html (window.__dbg), src/out/artifact.html
   python3 deadtide/src/build.py --deploy   -> also writes ../index.html (served by GitHub Pages)
   three.vendor.js: npx esbuild vendor_entry.js --bundle --format=iife --global-name=THREE --minify (three r160)
   artifact.html: no doctype/html/head/body wrappers, single-player only (claude.ai artifacts block WebRTC)."""
import os, re, sys
D = os.path.dirname(os.path.abspath(__file__))
src = lambda f: open(os.path.join(D, f), encoding='utf-8').read()
ORDER = ['00_core.js', '10_world.js', '20_nav.js', '30_sim.js', '35_zombies.js', '50_render.js', '60_audio.js', '62_input.js', '70_net.js', '80_ui.js', '90_main.js', '99_boot.js']
game = '\n'.join('/* ---- %s ---- */\n' % f + src(f) for f in ORDER)
vendor = src('three.vendor.js')
assert '</script' not in game and '</script' not in vendor
tpl = src('template.html')
assert tpl.count('__IOSMETA__') == 1 and tpl.count('__SCRIPTS__') == 1
IOS = ('<meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes">'
       '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"><meta name="apple-mobile-web-app-title" content="尸潮堡垒"><meta name="theme-color" content="#0b0c0f">')
def page(kind):
    pre = {'standalone': '', 'test': 'window.__dbg={speed:1};', 'artifact': 'window.__ARTIFACT__=true;'}[kind]
    scripts = '<script>' + vendor + '</script>\n<script>\n' + pre + '\n' + game + '\n</script>'
    body = tpl.replace('__IOSMETA__', IOS if kind != 'artifact' else '').replace('__SCRIPTS__', scripts)
    if kind == 'artifact':
        head, rest = body.split('<body>', 1)
        head = re.sub(r'<meta[^>]*>\s*', '', head).strip()
        out = head + '\n' + rest.replace('</body>', '').strip() + '\n'
        assert '<html' not in out and '<body' not in out and out.lstrip().startswith('<title>')
        return out
    return '<!doctype html>\n<html lang="zh-CN">\n<head>\n' + body.replace('<body>', '</head>\n<body>', 1) + '\n</html>\n'
out = os.path.join(D, 'out'); os.makedirs(out, exist_ok=True)
for k, f in [('standalone', 'index.html'), ('test', 'test.html'), ('artifact', 'artifact.html')]:
    open(os.path.join(out, f), 'w', encoding='utf-8').write(page(k))
if '--deploy' in sys.argv:
    open(os.path.join(D, '..', 'index.html'), 'w', encoding='utf-8').write(page('standalone'))
    print('deployed ../index.html')
print('built', os.path.getsize(os.path.join(out, 'index.html')) // 1024, 'KB')
