"""Pack rendered frames into WebP sprite atlases + JSON meta.
Units: grid rows = 8 dirs (E,SE,S,SW,W,NW,N,NE), cols = frames (anims in order).
Props: shelf-packed into one atlas.  All sheets are 2x display resolution."""
import json, os, sys
from PIL import Image, ImageFilter

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
FR = os.path.join(ROOT, 'frames'); OUT = os.path.join(ROOT, 'work', 'atlas')
os.makedirs(OUT, exist_ok=True)
SCALE = 0.36            # render px (150/unit) -> sheet px (54/unit) ; display = 33 px/unit
Q = 80
PSCALE = 0.44  # props: tile 1.45u -> 96 px = 2x display (48)

def outline(im, k, col=(22, 14, 24)):
    a = im.getchannel('A').point(lambda v: 255 if v > 110 else 0)
    d = a.filter(ImageFilter.MaxFilter(k))
    ol = Image.new('RGBA', im.size, col + (0,)); ol.putalpha(d.point(lambda v: 235 if v else 0))
    ol.alpha_composite(im)
    return ol

def pack_unit(u):
    meta = json.load(open(os.path.join(FR, u, 'meta.json')))
    anims = {k: v for k, v in meta['anims'].items() if k != 'die'}; order = list(anims.keys())
    cols = []
    for a in order:
        for f in range(anims[a]): cols.append((a, f))
    ims = {}; box = None
    for (a, f) in cols:
        for d in range(8):
            im = Image.open(os.path.join(FR, u, f'{a}_{f}_{d}.png')).convert('RGBA')
            ims[(a, f, d)] = im
            b = im.getchannel('A').point(lambda v: 255 if v > 20 else 0).getbbox()
            if b: box = b if box is None else (min(box[0], b[0]), min(box[1], b[1]), max(box[2], b[2]), max(box[3], b[3]))
    pad = 6
    box = (box[0] - pad, box[1] - pad, box[2] + pad, box[3] + pad)
    any_m = meta['frames'][f'{order[0]}_0_0']
    ax, ay = any_m['ax'] - box[0], any_m['ay'] - box[1]
    cw = round((box[2] - box[0]) * SCALE); ch = round((box[3] - box[1]) * SCALE)
    sheet = Image.new('RGBA', (cw * len(cols), ch * 8), (0, 0, 0, 0))
    for ci, (a, f) in enumerate(cols):
        for d in range(8):
            im = outline(ims[(a, f, d)].crop(box), 7)
            im = im.resize((cw, ch), Image.LANCZOS)
            sheet.alpha_composite(im, (ci * cw, d * ch))
    sheet.save(os.path.join(OUT, u + '.webp'), 'WEBP', quality=Q, method=6)
    am = {}; c = 0
    for a in order: am[a] = [c, anims[a]]; c += anims[a]
    return {'cw': cw, 'ch': ch, 'ax': round(ax * SCALE, 1), 'ay': round(ay * SCALE, 1), 'anims': am}

FLAT = {'spikes', 'tar', 'spring', 'brimstone', 'frost', 'arrowwall', 'grinder'}
def pack_props():
    meta = json.load(open(os.path.join(FR, 'props', 'meta.json')))
    items = []
    for k, m in meta.items():
        name = k.split('_')[0]
        im = Image.open(os.path.join(FR, 'props', k + '.png')).convert('RGBA')
        b = im.getchannel('A').point(lambda v: 255 if v > 20 else 0).getbbox()
        b = (b[0] - 4, b[1] - 4, b[2] + 4, b[3] + 4)
        im = outline(im.crop(b), 5)
        sy = 1.133 if name in FLAT else 1.0
        w = round(im.width * PSCALE); h = round(im.height * PSCALE * sy)
        im = im.resize((w, h), Image.LANCZOS)
        items.append((k, im, (m['ax'] - b[0]) * PSCALE, (m['ay'] - b[1]) * PSCALE * sy))
    items.sort(key=lambda t: -t[1].height)
    W = 1400; x = y = rowh = 0; rects = {}
    for k, im, ax, ay in items:
        if x + im.width > W: x = 0; y += rowh + 2; rowh = 0
        rects[k] = [x, y, im.width, im.height, round(ax, 1), round(ay, 1)]
        x += im.width + 2; rowh = max(rowh, im.height)
    sheet = Image.new('RGBA', (W, y + rowh), (0, 0, 0, 0))
    for k, im, ax, ay in items: sheet.alpha_composite(im, tuple(rects[k][:2]))
    sheet.save(os.path.join(OUT, 'props.webp'), 'WEBP', quality=85, method=6)
    return rects

if __name__ == '__main__':
    units = ['warmage', 'sorc', 'grunt', 'kobold', 'archer', 'ogre', 'bat', 'chief']
    meta = {'units': {}, 'props': None, 'uk': 33 / (150 * SCALE), 'pk': 0.5}
    old = os.path.join(OUT, 'atlas.json')
    if os.path.exists(old): meta.update({k: v for k, v in json.load(open(old)).items() if k not in ('uk', 'pk')})
    want = sys.argv[1:] or units + ['props']
    for u in want:
        if u == 'props': meta['props'] = pack_props()
        else: meta['units'][u] = pack_unit(u)
        print(u, 'ok', os.path.getsize(os.path.join(OUT, (u if u != 'props' else 'props') + '.webp')) // 1024, 'KB')
    json.dump(meta, open(old, 'w'))
