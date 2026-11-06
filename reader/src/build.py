"""Build 墨阅 reader: python3 reader/src/build.py [pages|artifact|local] [out]
pages (default) -> reader/index.html, libraries from CDN, GitHub sync on
artifact        -> claude.ai artifact page (no GitHub sync, system fonts for PDFs)
local           -> loads libraries from ./lib first (offline copy with pdf.js cmaps)"""
import os, sys, urllib.parse
HERE = os.path.dirname(os.path.abspath(__file__))
build = sys.argv[1] if len(sys.argv) > 1 else 'pages'
out = sys.argv[2] if len(sys.argv) > 2 else os.path.join(HERE, '..', 'index.html')
rd = lambda f: open(os.path.join(HERE, f), encoding='utf-8').read()
css, body = rd('app.css'), rd('body.html')
js = '\n'.join(rd(f) for f in ['i18n.js', 'formats.js', 'sync.js', 'app.js'])
assert "const BUILD = 'local';" in js
js = js.replace("const BUILD = 'local';", "const BUILD = '%s';" % build)
glyphs = ''.join(sorted(set('墨阅文把文件拖到这里书架无法打开这个MoyueReaderDropafilehereLibraryThisdocumentcouldnotbeopened')))
seal = 'https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@700;900&display=swap&text=' + urllib.parse.quote(glyphs)
html = f'''<!DOCTYPE html>
<html lang="zh-CN" data-theme="paper">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#EDF0F2">
<meta name="apple-mobile-web-app-capable" content="yes">
<title>墨阅</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="{seal}">
<style>
{css}
</style>
</head>
<body>
{body}
<script>
'use strict';
{js}
</script>
</body>
</html>
'''
assert '�' not in html
open(out, 'w', encoding='utf-8').write(html)
print(build, out, len(html))
