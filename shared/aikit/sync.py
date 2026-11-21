"""Copy the canonical AIKit (shared/aikit/aikit.js) into every game that uses it.
   A game opts in by having <game>/src/vendor/aikit.js. Games stay self-contained: each build.py inlines its own copy.
   python3 shared/aikit/sync.py   -> copy + report which games changed (rebuild those)"""
import os, shutil, filecmp, glob
D = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(D))
changed = []
for vend in sorted(glob.glob(os.path.join(ROOT, '*', 'src', 'vendor')) + glob.glob(os.path.join(ROOT, '*', 'src', '*', 'vendor'))):
    dst = os.path.join(vend, 'aikit.js')
    if not os.path.exists(dst): continue
    if not filecmp.cmp(os.path.join(D, 'aikit.js'), dst, shallow=False):
        shutil.copyfile(os.path.join(D, 'aikit.js'), dst); changed.append(os.path.relpath(dst, ROOT))
print('\n'.join(changed) or 'all vendored copies up to date')
