"""Contact sheet of preview frames: python3 sheet.py <unit> [scale]"""
import sys, json, os
from PIL import Image, ImageDraw
D = os.path.join(os.path.dirname(__file__), '..', 'frames', '_preview')
u = sys.argv[1]; sc = float(sys.argv[2]) if len(sys.argv) > 2 else 0.5
meta = json.load(open(os.path.join(D, u + '.json')))
keys = list(meta.keys())
rows = {}
for k in keys:
    _, a, f, d = k.rsplit('_', 3)
    rows.setdefault(f'{a}_{f}', []).append(k)
ims = []
for r, ks in rows.items():
    row = [Image.open(os.path.join(D, k + '.png')) for k in ks]
    ims.append((r, row))
w = max(sum(int(i.width * sc) for i in row) for _, row in ims)
h = sum(int(row[0].height * sc) for _, row in ims)
out = Image.new('RGBA', (w + 80, h), (120, 128, 120, 255))
dr = ImageDraw.Draw(out)
y = 0
for r, row in ims:
    x = 80
    dr.text((4, y + 10), r, fill=(0, 0, 0, 255))
    for i in row:
        i2 = i.resize((int(i.width * sc), int(i.height * sc)), Image.LANCZOS)
        out.alpha_composite(i2, (x, y)); x += i2.width
    y += int(row[0].height * sc)
out.save(os.path.join(D, f'_sheet_{u}.png'))
print(out.size)
