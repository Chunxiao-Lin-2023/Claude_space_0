"""Copy the canonical TitleKit (shared/titlekit/titlekit.{js,css}) into every game that uses it.
   A game opts in by having <game>/src/vendor/titlekit.js (or the path listed in TARGETS below).
   Games stay self-contained: each build.py inlines its own vendored copy, never ../shared.
   python3 shared/titlekit/sync.py          -> copy + report which games changed (rebuild those)"""
import os, shutil, filecmp, glob
D = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(D))
changed = []
for vend in sorted(glob.glob(os.path.join(ROOT, '*', 'src', 'vendor')) + glob.glob(os.path.join(ROOT, '*', 'src', '*', 'vendor'))):
    if not os.path.exists(os.path.join(vend, 'titlekit.js')): continue
    for f in ('titlekit.js', 'titlekit.css'):
        dst = os.path.join(vend, f)
        if not os.path.exists(dst) or not filecmp.cmp(os.path.join(D, f), dst, shallow=False):
            shutil.copyfile(os.path.join(D, f), dst); changed.append(os.path.relpath(dst, ROOT))
print('\n'.join(changed) or 'all vendored copies up to date')
