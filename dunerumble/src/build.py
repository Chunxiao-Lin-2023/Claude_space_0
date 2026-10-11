"""Concatenate the game sources into single-file pages.
   out/test.html      – with window.__dbg hooks, used by test/*.js (serve out/ on :8765)
   out/artifact.html  – no doctype, single-player only (claude.ai artifact)
   ../index.html      – standalone page served by GitHub Pages (only with --deploy)"""
import os, sys
D = os.path.dirname(os.path.abspath(__file__))
src = lambda f: open(os.path.join(D, f), encoding='utf-8').read()
ORDER = ['00_core.js', '10_map.js', '20_models.js', '30_sim.js', '40_ai.js', '50_render.js', '60_io.js', '70_net.js', '80_main.js']
game = '\n'.join(src(f) for f in ORDER)
vendor = src('three.vendor.js')  # npx esbuild vendor_entry.js --bundle --format=iife --global-name=THREE --minify
tpl = src('template.html')
IOS = '<meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"><meta name="apple-mobile-web-app-title" content="沙丘乱斗"><meta name="theme-color" content="#1a1220">'
def page(kind):
    pre = {'standalone': '', 'artifact': 'window.__ARTIFACT__=true;', 'test': 'window.__dbg={speed:1};'}[kind]
    scripts = '<script>' + vendor + '</script>\n<script>\n' + pre + '\n' + game + '\n</script>'
    body = tpl.replace('__IOSMETA__', IOS if kind != 'artifact' else '').replace('__SCRIPTS__', scripts)
    head = '<!doctype html>\n<html lang="zh-CN">\n<head>' if kind != 'artifact' else '<html lang="zh-CN">\n<head>'
    return head + body.replace('<body>', '</head>\n<body>', 1) + '\n</html>\n'
out = os.path.join(D, 'out'); os.makedirs(out, exist_ok=True)
for k, f in [('standalone', 'index.html'), ('artifact', 'artifact.html'), ('test', 'test.html')]:
    open(os.path.join(out, f), 'w', encoding='utf-8').write(page(k))
if '--deploy' in sys.argv:
    open(os.path.join(D, '..', 'index.html'), 'w', encoding='utf-8').write(page('standalone'))
    print('deployed ../index.html')
print('built', os.path.getsize(os.path.join(out, 'index.html')) // 1024, 'KB')
