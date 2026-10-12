"""Build cloudisle/index.html from src/game.html.

Usage (from anywhere):  python3 cloudisle/src/build.py [--artifact OUT.html]
- index.html: doctype + iOS meta tags, the page served by GitHub Pages
- --artifact: optional variant without <html>/<head>/<body> wrappers (used for Claude previews)
"""
import os, re, sys
HERE=os.path.dirname(os.path.abspath(__file__))
src=open(os.path.join(HERE,'game.html'),encoding='utf8').read()
IOS='''<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="云岛冒险">
<meta name="theme-color" content="#151022">'''
assert src.count('<!--IOSMETA-->')==1
out=os.path.join(HERE,'..','index.html')
open(out,'w',encoding='utf8').write('<!doctype html>\n'+src.replace('<!--IOSMETA-->',IOS))
print('built',os.path.normpath(out),len(src))
if '--artifact' in sys.argv:
    dst=sys.argv[sys.argv.index('--artifact')+1]
    head=re.search(r'<head>(.*?)</head>',src,re.S).group(1)
    head=re.sub(r'<meta[^>]*>\s*','',head).replace('<!--IOSMETA-->','').strip()
    body=re.search(r'<body>(.*)</body>',src,re.S).group(1).strip()
    art=head+'\n'+body+'\n'
    assert '<html' not in art and '<body' not in art and art.lstrip().startswith('<title>')
    open(dst,'w',encoding='utf8').write(art);print('artifact',dst)
