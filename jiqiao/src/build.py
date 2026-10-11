"""机巧百战 build: src/game.html (+ data URIs in uris.json) -> ../index.html (standalone, deployed)
and out/artifact.html (no doctype, for a claude.ai artifact; single-player only)."""
import json, os
R = os.path.dirname(os.path.abspath(__file__))
s = open(os.path.join(R, 'game.html'), encoding='utf-8').read()
for k, v in json.load(open(os.path.join(R, 'uris.json'))).items():
    s = s.replace(k, v)
os.makedirs(os.path.join(R, 'out'), exist_ok=True)
open(os.path.join(R, 'out', 'artifact.html'), 'w', encoding='utf-8').write(s)
se = s.index('</style>') + 8
standalone = ('<!doctype html>\n<html lang="zh-CN">\n<head>\n<meta charset="utf-8">\n'
 '<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">\n'
 '<meta name="apple-mobile-web-app-capable" content="yes">\n<meta name="mobile-web-app-capable" content="yes">\n'
 '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">\n<meta name="apple-mobile-web-app-title" content="机巧百战">\n<meta name="theme-color" content="#0e1619">\n'
 + s[:se] + '\n</head>\n<body>\n' + s[se:] + '\n</body>\n</html>\n')
open(os.path.join(R, '..', 'index.html'), 'w', encoding='utf-8').write(standalone)
print('index.html', len(standalone))
