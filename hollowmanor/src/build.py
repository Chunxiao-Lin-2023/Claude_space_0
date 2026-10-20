"""Concatenate the game sources into single-file pages.
   out/test.html      – with window.__dbg hooks (serve out/ on :8765 for test/*.js)
   out/index.html     – standalone page (same as ../index.html)
   ../index.html      – standalone page served by GitHub Pages (only with --deploy)
   Two-player online only, so there is no claude.ai artifact build (artifacts block WebRTC)."""
import os, sys
D = os.path.dirname(os.path.abspath(__file__))
src = lambda f: open(os.path.join(D, f), encoding='utf-8').read()
ORDER = ['00_core.js', '10_map.js', '11_floor1.js', '12_floor2.js', '13_floor3.js', '20_tex.js', '21_models_env.js', '22_models_chars.js', '23_models_ghosts.js', '24_models_upper.js', '25_models_heroes.js', '30_sim.js', '35_ghost.js', '50_render.js', '51_frame.js', '60_audio.js', '62_input.js', '70_net.js', '80_ui.js', '90_main.js', '99_boot.js']
game = '\n'.join(src(f) for f in ORDER)
vendor = src('three.vendor.js')  # npx esbuild vendor_entry.js --bundle --format=iife --global-name=THREE --minify
tpl = src('template.html')
IOS = '<meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"><meta name="apple-mobile-web-app-title" content="幽宅双影"><meta name="theme-color" content="#020203">'
def page(kind):
    pre = {'standalone': '', 'test': 'window.__dbg={speed:1};'}[kind]
    scripts = '<script>' + vendor + '</script>\n<script>\n' + pre + '\n' + game + '\n</script>'
    body = tpl.replace('__IOSMETA__', IOS).replace('__SCRIPTS__', scripts)
    return '<!doctype html>\n<html lang="zh-CN">\n<head>' + body.replace('<body>', '</head>\n<body>', 1) + '\n</html>\n'
out = os.path.join(D, 'out'); os.makedirs(out, exist_ok=True)
for k, f in [('standalone', 'index.html'), ('test', 'test.html')]:
    open(os.path.join(out, f), 'w', encoding='utf-8').write(page(k))
if '--deploy' in sys.argv:
    open(os.path.join(D, '..', 'index.html'), 'w', encoding='utf-8').write(page('standalone'))
    print('deployed ../index.html')
print('built', os.path.getsize(os.path.join(out, 'index.html')) // 1024, 'KB')
